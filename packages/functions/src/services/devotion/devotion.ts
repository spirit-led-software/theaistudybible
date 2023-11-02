import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { axios, replicateConfig, s3Config } from "@core/configs";
import type {
  CreateDevotionData,
  Devotion,
  UpdateDevotionData,
} from "@core/model";
import { devotions, devotionsToSourceDocuments } from "@core/schema";
import { readOnlyDatabase, readWriteDatabase } from "@lib/database";
import { SQL, asc, desc, eq } from "drizzle-orm";
import Replicate from "replicate";
import { getDocumentVectorStore } from "../vector-db";
import { createDevotionImage } from "./image";
import {
  getBibleReadingChain,
  getDevotionGeneratorChain,
  getImageCaptionChain,
  getImagePromptChain,
} from "./langchain";

export async function getDevotions(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const {
    where,
    limit = 25,
    offset = 0,
    orderBy = desc(devotions.createdAt),
  } = options;

  return await readOnlyDatabase
    .select()
    .from(devotions)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getDevotion(id: string) {
  return (
    await readOnlyDatabase.select().from(devotions).where(eq(devotions.id, id))
  ).at(0);
}

export async function getDevotionOrThrow(id: string) {
  const devotion = await getDevotion(id);
  if (!devotion) {
    throw new Error(`Devotion with id ${id} not found`);
  }
  return devotion;
}

export async function getDevotionByDate(date: Date) {
  return (
    await readOnlyDatabase
      .select()
      .from(devotions)
      .where(eq(devotions.date, date))
  ).at(0);
}

export async function getDevotionSourceDocuments(devotion: Devotion) {
  const sourceDocumentRelationships = await readOnlyDatabase
    .select()
    .from(devotionsToSourceDocuments)
    .where(eq(devotionsToSourceDocuments.devotionId, devotion.id))
    .orderBy(asc(devotionsToSourceDocuments.distance));

  const vectorStore = await getDocumentVectorStore();
  const foundSourceDocuments = await vectorStore.getDocumentsByIds(
    sourceDocumentRelationships.map((d) => d.sourceDocumentId)
  );

  return foundSourceDocuments.map((d) => {
    const relationship = sourceDocumentRelationships.find(
      (d2) => d2.devotionId === d.id
    );
    return {
      ...d,
      distance: relationship?.distance ?? 0,
      distanceMetric: relationship?.distanceMetric ?? "cosine",
    };
  });
}

export async function createDevotion(data: CreateDevotionData) {
  return (
    await readWriteDatabase.insert(devotions).values(data).returning()
  )[0];
}

export async function updateDevotion(id: string, data: UpdateDevotionData) {
  return (
    await readWriteDatabase
      .update(devotions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(devotions.id, id))
      .returning()
  )[0];
}

export async function deleteDevotion(id: string) {
  return (
    await readWriteDatabase
      .delete(devotions)
      .where(eq(devotions.id, id))
      .returning()
  )[0];
}

export async function generateDevotion(topic?: string, bibleReading?: string) {
  let devo: Devotion | undefined;
  try {
    if (!topic || !bibleReading) {
      const { bibleReadingText, topic: newTopic } =
        await getRandomBibleReading();
      topic = newTopic;
      bibleReading = bibleReadingText;
    }

    const chain = await getDevotionGeneratorChain();
    const { result, sourceDocuments } = await chain.invoke({
      bibleReading,
    });

    devo = await createDevotion({
      topic,
      bibleReading,
      summary: result.summary,
      reflection: result.reflection,
      prayer: result.prayer,
    });

    await Promise.all(
      sourceDocuments.map(async (c) => {
        await readWriteDatabase.insert(devotionsToSourceDocuments).values({
          devotionId: devo!.id,
          sourceDocumentId: c.id,
          distance: c.distance,
          distanceMetric: c.distanceMetric,
        });
      })
    );

    await generateDevotionImages(devo);
  } catch (e) {
    console.error(e);
    if (devo) {
      devo = await updateDevotion(devo.id, { failed: true });
    }
  }

  return devo;
}

async function generateDevotionImages(devo: Devotion) {
  const imagePromptChain = getImagePromptChain();
  const imagePrompts = await imagePromptChain.invoke({
    bibleReading: devo.bibleReading,
    summary: devo.summary,
    reflection: devo.reflection,
    prayer: devo.prayer,
  });
  console.log("Image prompts:", imagePrompts.prompt);

  const imageCaptionChain = getImageCaptionChain();
  const imageCaption = await imageCaptionChain.invoke({
    imagePrompt: imagePrompts.prompt,
    bibleReading: devo.bibleReading,
    summary: devo.summary,
    reflection: devo.reflection!,
    prayer: devo.prayer!,
  });
  console.log("Image caption:", imageCaption);

  const replicate = new Replicate({
    auth: replicateConfig.apiKey,
  });
  const output = await replicate.run(replicateConfig.imageModel, {
    input: {
      prompt: imagePrompts.prompt,
      negative_prompt: imagePrompts.negativePrompt,
      width: 512,
      height: 512,
      num_outputs: 2,
      num_inference_steps: 100,
      refine: "expert_ensemble_refiner",
    },
  });
  console.log("Output from replicate:", output);
  if (!Array.isArray(output)) {
    throw new Error("Replicate output not formatted as expected");
  }

  const urlArray = output as string[];

  for (let i = 0; i < urlArray.length; i++) {
    const url = urlArray[i];
    try {
      const image = await axios.get(url, {
        responseType: "arraybuffer",
      });

      const s3Client = new S3Client({});
      const s3Url = await getSignedUrl(
        s3Client,
        new PutObjectCommand({
          ACL: "public-read",
          ContentType: "image/png",
          Bucket: s3Config.devotionImageBucket,
          Key: `${devo.id}-${i}.png`,
        })
      );

      if (!s3Url) {
        throw new Error("Failed to get presigned url for s3 upload");
      }

      const s3UploadResponse = await axios.put(s3Url, image.data, {
        headers: {
          "Content-Type": "image/png",
          "Content-Length": image.data.byteLength,
        },
      });

      if (s3UploadResponse.status !== 200) {
        throw new Error(
          `Failed to upload image to s3: ${s3UploadResponse.status} ${s3UploadResponse.statusText}`
        );
      }

      const imageUrl = s3Url.split("?")[0];
      await createDevotionImage({
        devotionId: devo.id,
        url: imageUrl,
        caption: imageCaption,
        prompt: imagePrompts.prompt,
        negativePrompt: imagePrompts.negativePrompt,
      });
    } catch (e) {
      console.error("Error saving devotion image", e);
    }
  }
}

async function getRandomBibleReading() {
  const topic = getRandomTopic();
  console.log(`Devotion topic: ${topic}`);
  const chain = await getBibleReadingChain();
  const result = await chain.invoke({
    topic,
  });

  const bibleReadingText = `${result.book} ${result.chapter}:${result.verseRange} - ${result.text}`;
  console.log(`Bible reading: ${bibleReadingText}`);

  return { topic, bibleReadingText };
}

function getRandomTopic() {
  const topics = [
    "love",
    "faith",
    "hope",
    "joy",
    "peace",
    "patience",
    "kindness",
    "goodness",
    "gentleness",
    "self-control",
    "forgiveness",
    "prayer",
    "history",
    "prophecy",
    "salvation",
    "sin",
    "heaven",
    "hell",
    "baptism",
    "communion",
    "money",
    "work",
    "marriage",
    "children",
    "family",
  ];

  return topics[Math.floor(Math.random() * topics.length)];
}
