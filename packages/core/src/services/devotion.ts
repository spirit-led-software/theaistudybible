import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { SQL, desc, eq } from "drizzle-orm";
import { LLMChain } from "langchain/chains";
import { PromptTemplate } from "langchain/prompts";
import { axios, s3Config } from "../configs";
import { db } from "../database";
import {
  CreateDevotionData,
  Devotion,
  SourceDocument,
  UpdateDevotionData,
} from "../database/model";
import {
  devotions,
  devotionsToSourceDocuments,
  sourceDocuments,
} from "../database/schema";
import { getCompletionsModel, getOpenAiClient, getPromptModel } from "./llm";
import { createSourceDocument, getSourceDocumentByText } from "./source-doc";
import { getVectorStore } from "./vector-db";

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
    const sourceDocument = (
      await db
        .select()
        .from(sourceDocuments)
        .where(eq(sourceDocuments.id, sourceDocumentId))
    )[0];
    foundSourceDocuments.push(sourceDocument);
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
      context.map(async (c) => {
        let sourceDoc: SourceDocument | undefined;
        const existingSourceDoc = await getSourceDocumentByText(c.pageContent);

        if (existingSourceDoc) {
          sourceDoc = existingSourceDoc;
        } else {
          sourceDoc = await createSourceDocument({
            text: c.pageContent,
            metadata: c.metadata,
          });
        }

        await db.insert(devotionsToSourceDocuments).values({
          devotionId: devo!.id,
          sourceDocumentId: sourceDoc.id,
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

  const imageCaptionChain = new LLMChain({
    llm: getPromptModel(),
    prompt:
      PromptTemplate.fromTemplate(`Generate a caption for the image that would be generated by this prompt:
{imagePrompt}`),
  });
  const imageCaption = await imageCaptionChain.call({
    imagePrompt: imagePrompt.text,
  });

  const openai = getOpenAiClient();
  const imageResponse = await openai.createImage({
    prompt: imagePrompt.text,
    n: 1,
    response_format: "url",
    size: "512x512",
  });

  if (imageResponse.status !== 200) {
    throw new Error(
      `Failed to create image: ${imageResponse.status} ${imageResponse.statusText}`
    );
  }

  const imageUrl = imageResponse.data.data[0].url;
  if (!imageUrl) {
    throw new Error("No image url returned from OpenAI");
  }

  const image = await axios.get(imageUrl, {
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
