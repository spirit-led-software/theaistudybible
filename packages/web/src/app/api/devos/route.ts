import axios from "@client/axios";
import { model } from "@server/llm";
import { prisma } from "@server/database";
import { getVectorStore } from "@server/vector-db";
import { LLMChain } from "langchain/chains";
import { PromptTemplate } from "langchain/prompts";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "25");

  const devos = await prisma.devo.findMany({
    orderBy: {
      createdAt: "desc",
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  return NextResponse.json({
    entities: devos,
    page,
    perPage: limit,
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const data = await request.json();
  let bibleVerse = data.bibleVerse;
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

  const devo = await prisma.devo.create({
    data: {
      subject: bibleVerse,
      content: result.text,
      sourceDocuments: {
        create: context.map((c) => ({
          sourceDocument: {
            connectOrCreate: {
              where: {
                text: c.pageContent,
              },
              create: {
                text: c.pageContent,
                metadata: c.metadata,
              },
            },
          },
        })),
      },
    },
    include: {
      sourceDocuments: true,
    },
  });

  return new NextResponse(JSON.stringify(devo), {
    status: 201,
  });
}

async function getRandomBibleVerse(): Promise<string> {
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
