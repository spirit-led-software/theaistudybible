import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { SQL, desc, eq } from "drizzle-orm";
import { LLMChain } from "langchain/chains";
import { PromptTemplate } from "langchain/prompts";
import Replicate from "replicate";
import { axios, replicateConfig, s3Config } from "../configs";
import { db } from "../database";
import {
  CreateDevotionData,
  Devotion,
  SourceDocument,
  UpdateDevotionData,
} from "../database/model";
import { devotions, devotionsToSourceDocuments } from "../database/schema";
import { getCompletionsModel, getPromptModel } from "./llm";
import { getSourceDocument, getVectorStore } from "./vector-db";

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

  return await db
    .select()
    .from(devotions)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getDevotion(id: string) {
  return (await db.select().from(devotions).where(eq(devotions.id, id))).at(0);
}

export async function getDevotionOrThrow(id: string) {
  const devotion = await getDevotion(id);
  if (!devotion) {
    throw new Error(`Devotion with id ${id} not found`);
  }
  return devotion;
}

export async function getDevotionByDate(date: Date) {
  return (await db.select().from(devotions).where(eq(devotions.date, date))).at(
    0
  );
}

export async function getDevotionRelatedSourceDocuments(devotion: Devotion) {
  const sourceDocumentIds = (
    await db
      .select()
      .from(devotionsToSourceDocuments)
      .where(eq(devotionsToSourceDocuments.devotionId, devotion.id))
  ).map((d) => d.sourceDocumentId);

  const foundSourceDocuments: SourceDocument[] = [];
  for (const sourceDocumentId of sourceDocumentIds) {
    const sourceDocument = await getSourceDocument(sourceDocumentId);
    if (sourceDocument) {
      foundSourceDocuments.push(sourceDocument);
    }
  }

  return foundSourceDocuments;
}

export async function createDevotion(data: CreateDevotionData) {
  return (await db.insert(devotions).values(data).returning())[0];
}

export async function updateDevotion(id: string, data: UpdateDevotionData) {
  return (
    await db
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
    await db.delete(devotions).where(eq(devotions.id, id)).returning()
  )[0];
}

export async function generateDevotion(bibleVerse?: string) {
  let devo: Devotion | undefined;
  try {
    if (!bibleVerse) {
      bibleVerse = await getRandomBibleVerse();
    }

    const fullPrompt = PromptTemplate.fromTemplate(`Given the context:
{context}

And the following Bible verse:
{bibleVerse}

Write a daily devotional between 800 to 1000 words. Start by reciting the Bible verse,
then write a summary of the verse which should include other related Bible verses.
The summary can include a story or an analogy. Then, write a reflection on the verse.
Finally, write a prayer to wrap up the devotional.`);

    const vectorStore = await getVectorStore();
    const context = await vectorStore.similaritySearch(bibleVerse, 10);
    const chain = new LLMChain({
      llm: getCompletionsModel(),
      prompt: fullPrompt,
    });
    const result = await chain.call({
      bibleVerse: bibleVerse,
      context: context.map((c) => c.pageContent).join("\n"),
    });

    devo = await createDevotion({
      subject: bibleVerse,
      content: result.text,
    });

    await Promise.all(
      // @ts-ignore
      context.map(async (c: SourceDocument) => {
        await db.insert(devotionsToSourceDocuments).values({
          devotionId: devo!.id,
          sourceDocumentId: c.id,
        });
      })
    );

    devo = await generateDevotionImage(devo);
  } catch (e) {
    console.error(e);
    if (devo) {
      devo = await updateDevotion(devo.id, { failed: true });
    }
  }

  return devo;
}

async function generateDevotionImage(devo: Devotion) {
  const imagePromptChain = new LLMChain({
    llm: getCompletionsModel(),
    prompt: PromptTemplate.fromTemplate(
      `Generate a prompt under 1000 characters that will create an image for the following devotion:
{devotion}`
    ),
  });
  const imagePrompt = await imagePromptChain.call({
    devotion: devo.content,
  });

  const negativeImagePromptChain = new LLMChain({
    llm: getCompletionsModel(),
    prompt: PromptTemplate.fromTemplate(
      `Generate a negative prompt (things that the AI model should avoid including in the image) under 1000 characters that will create an image for the following devotion:
{devotion}`
    ),
  });
  const negativeImagePrompt = await negativeImagePromptChain.call({
    devotion: devo.content,
  });

  const imageCaptionChain = new LLMChain({
    llm: getPromptModel(),
    prompt:
      PromptTemplate.fromTemplate(`Generate a caption for the image that would be generated by this prompt:
{imagePrompt}`),
  });
  const imageCaption = await imageCaptionChain.call({
    imagePrompt: imagePrompt.text,
  });

  const replicate = new Replicate({
    auth: replicateConfig.apiKey,
  });

  const output = (await replicate.run(replicateConfig.imageModel, {
    input: {
      prompt: `${imagePrompt.text}. 8k, beautiful, high quality, realistic.`,
      negative_prompt: `${negativeImagePrompt.text}. Ugly, low quality, unrealistic, blurry.`,
      width: 512,
      height: 512,
      num_outputs: 1,
      num_inference_steps: 100,
      refine: "expert_ensemble_refiner",
    },
  })) as string[];

  const image = await axios.get(output[0], {
    responseType: "arraybuffer",
  });

  const s3Client = new S3Client({});
  const s3Url = await getSignedUrl(
    s3Client,
    new PutObjectCommand({
      ACL: "public-read",
      ContentType: "image/png",
      Bucket: s3Config.devotionImageBucket,
      Key: `${devo.id}.png`,
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

  return await updateDevotion(devo.id, {
    imageCaption: imageCaption.text,
    imageUrl: s3UploadResponse.config.url?.split("?")[0],
  });
}

async function getRandomBibleVerse() {
  const response = await axios.get(
    "https://labs.bible.org/api?passage=random&type=json&formatting=plain",
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  const verseData = response.data[0];
  const verse = `${verseData.bookname} ${verseData.chapter}:${verseData.verse} - ${verseData.text}`;
  return verse;
}
