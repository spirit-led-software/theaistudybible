import { InferModel, SQL, desc, eq } from "drizzle-orm";
import { LLMChain } from "langchain/chains";
import { PromptTemplate } from "langchain/prompts";
import { axios } from "../configs";
import { db } from "../database";
import { CreateDevotionData, UpdateDevotionData } from "../database/model";
import {
  devotions,
  devotionsToSourceDocuments,
  sourceDocuments,
} from "../database/schema";
import { getCompletionsModel } from "./llm";
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

  return await db.query.devotions.findMany({
    where,
    orderBy,
    limit,
    offset,
  });
}

export async function getDevotion(id: string) {
  return await db.query.devotions.findFirst({
    where: eq(devotions.id, id),
    with: {
      sourceDocuments: true,
    },
  });
}

export async function getDevotionOrThrow(id: string) {
  const devotion = await getDevotion(id);
  if (!devotion) {
    throw new Error(`Devotion with id ${id} not found`);
  }
  return devotion;
}

export async function createDevotion(data: CreateDevotionData) {
  return (await db.insert(devotions).values(data).returning())[0];
}

export async function updateDevotion(id: string, data: UpdateDevotionData) {
  return (
    await db.update(devotions).set(data).where(eq(devotions.id, id)).returning()
  )[0];
}

export async function deleteDevotion(id: string) {
  return (
    await db.delete(devotions).where(eq(devotions.id, id)).returning()
  )[0];
}

export async function generateDevotion(bibleVerse?: string) {
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
  const context = await vectorStore.similaritySearch(bibleVerse, 5);
  const chain = new LLMChain({
    llm: getCompletionsModel(),
    prompt: fullPrompt,
  });
  const result = await chain.call({
    bibleVerse: bibleVerse,
    context: context.map((c) => c.pageContent).join("\n"),
  });

  const devo = await createDevotion({
    subject: bibleVerse,
    content: result.text,
  });

  context.forEach(async (c) => {
    let sourceDoc: InferModel<typeof sourceDocuments, "select">;
    const existingSourceDoc = await db.query.sourceDocuments.findFirst({
      where: eq(sourceDocuments.text, c.pageContent),
    });

    if (existingSourceDoc) {
      sourceDoc = existingSourceDoc;
    } else {
      sourceDoc = (
        await db
          .insert(sourceDocuments)
          .values({
            text: c.pageContent,
            metadata: c.metadata,
          })
          .returning()
      )[0];
    }

    await db.insert(devotionsToSourceDocuments).values({
      devotionId: devo.id,
      sourceDocumentId: sourceDoc.id,
    });
  });

  return devo;
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
