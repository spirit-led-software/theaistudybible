import { axios } from "@configs";
import { Prisma } from "@prisma/client";
import { prisma } from "@services/database";
import { LLMChain } from "langchain/chains";
import { PromptTemplate } from "langchain/prompts";
import { model } from "../llm";
import { getVectorStore } from "../vector-db";
import { GetDevotionOptions, GetDevotionsOptions } from "./types";

export async function getDevotions(options?: GetDevotionsOptions) {
  const {
    query,
    limit = 25,
    offset = 0,
    orderBy = {
      createdAt: "desc",
    },
    include,
  } = options ?? {};

  return await prisma.devotion.findMany({
    where: query,
    take: limit,
    skip: offset,
    orderBy,
    include,
  });
}

export async function getDevotion(id: string, options?: GetDevotionOptions) {
  const { throwOnNotFound = false, include } = options ?? {};

  if (throwOnNotFound) {
    return await prisma.devotion.findUniqueOrThrow({
      where: {
        id,
      },
      include,
    });
  }

  return await prisma.devotion.findUnique({
    where: {
      id,
    },
    include,
  });
}

export async function createDevotion(data: Prisma.DevotionCreateInput) {
  return await prisma.devotion.create({
    data,
  });
}

export async function updateDevotion(
  id: string,
  data: Prisma.DevotionUpdateInput
) {
  return await prisma.devotion.update({
    where: {
      id,
    },
    data,
  });
}

export async function deleteDevotion(id: string) {
  const devo = await prisma.devotion.findUniqueOrThrow({
    where: {
      id,
    },
  });

  await prisma.devotion.delete({
    where: {
      id: devo.id,
    },
  });
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
    llm: model,
    prompt: fullPrompt,
  });
  const result = await chain.call({
    bibleVerse: bibleVerse,
    context: context.map((c) => c.pageContent).join("\n"),
  });

  const devo = await createDevotion({
    subject: bibleVerse,
    content: result.text,
    sourceDocuments: {
      connectOrCreate: context.map(
        (c: {
          pageContent: string;
          metadata: any;
        }): Prisma.SourceDocumentCreateOrConnectWithoutDevotionsInput => ({
          where: {
            text: c.pageContent,
          },
          create: {
            text: c.pageContent,
            metadata: c.metadata,
          },
        })
      ),
    },
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
