import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { axios, replicateConfig, s3Config } from "@core/configs";
import {
  CreateDevotionData,
  Devotion,
  SourceDocument,
  UpdateDevotionData,
} from "@core/model";
import { devotions, devotionsToSourceDocuments } from "@core/schema";
import { readOnlyDatabase, readWriteDatabase } from "@lib/database";
import { SQL, desc, eq } from "drizzle-orm";
import { LLMChain, RetrievalQAChain } from "langchain/chains";
import { StructuredOutputParser } from "langchain/output_parsers";
import { PromptTemplate } from "langchain/prompts";
import { ContextualCompressionRetriever } from "langchain/retrievers/contextual_compression";
import Replicate from "replicate";
import { z } from "zod";
import { CustomLLMChainExtractor } from "../../../../core/src/chains/CustomLLMChainExtractor";
import { getCompletionsModel, getPromptModel } from "../llm";
import { getDocumentVectorStore, getSourceDocuments } from "../vector-db";
import { createDevotionImage } from "./image";

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
  const sourceDocumentIds = (
    await readOnlyDatabase
      .select()
      .from(devotionsToSourceDocuments)
      .where(eq(devotionsToSourceDocuments.devotionId, devotion.id))
  ).map((d) => d.sourceDocumentId);

  const foundSourceDocuments: SourceDocument[] = await getSourceDocuments(
    sourceDocumentIds
  );

  return foundSourceDocuments;
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

export async function generateDevotion(bibleReading?: string) {
  let devo: Devotion | undefined;
  try {
    if (!bibleReading) {
      bibleReading = await getRandomBibleReading();
    }

    const outputParser = StructuredOutputParser.fromZodSchema(
      z.object({
        summary: z
          .string()
          .describe(
            "A summary of the bible reading. Between 1500 and 3000 characters in length."
          ),
        reflection: z
          .string()
          .describe(
            "A reflection on the bible reading and summary. Between 1500 and 3000 characters in length."
          ),
        prayer: z
          .string()
          .describe(
            "A prayer to end the devotion. Between 500 and 1500 characters in length."
          ),
      })
    );
    console.log(
      `Devotion format instructions: ${outputParser.getFormatInstructions()}`
    );

    const fullPrompt = PromptTemplate.fromTemplate(
      `Given the following Bible reading:\n{bibleReading}\n\n
      Write a non-denominational Christian devotion.\n\n
      {format_instructions}`,
      {
        partialVariables: {
          format_instructions: outputParser.getFormatInstructions(),
        },
      }
    );

    const vectorStore = await getDocumentVectorStore();
    const chain = RetrievalQAChain.fromLLM(
      getCompletionsModel(0.5), // Temperature needs to be lower here for the more concise response
      new ContextualCompressionRetriever({
        baseCompressor: CustomLLMChainExtractor.fromLLM(getPromptModel(0.5)),
        baseRetriever: vectorStore.asRetriever(15),
      }),
      {
        returnSourceDocuments: true,
        inputKey: "prompt",
      }
    );
    const result = await chain.call({
      prompt: await fullPrompt.format({
        bibleReading,
      }),
    });
    const output = await outputParser.parse(result.text);
    devo = await createDevotion({
      bibleReading,
      summary: output.summary,
      reflection: output.reflection,
      prayer: output.prayer,
    });

    await Promise.all(
      result.sourceDocuments.map(async (c: SourceDocument) => {
        await readWriteDatabase.insert(devotionsToSourceDocuments).values({
          devotionId: devo!.id,
          sourceDocumentId: c.id,
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
  const imagePromptOutputParser = StructuredOutputParser.fromZodSchema(
    z.object({
      prompt: z
        .string()
        .describe(
          "The image generation prompt. Between 800 and 1000 characters in length."
        ),
      negativePrompt: z
        .string()
        .describe(
          "The negative image generation prompt. Between 800 and 1000 characters in length."
        ),
    })
  );
  const imagePromptChain = new LLMChain({
    llm: getCompletionsModel(0.5), // Temperature needs to be lower here for the more concise response
    prompt: PromptTemplate.fromTemplate(
      `Create an image generation prompt and a negative image generation prompt. Do not be verbose. Try to only use adjectives and nouns if possible in each. Base it on the following devotion:\n
      Bible Reading:\n{bibleReading}\n\n
      Summary:\n{summary}\n\n
      Reflection:\n{reflection}\n\n
      Prayer:\n{prayer}\n\n
      {format_instructions}`,
      {
        partialVariables: {
          format_instructions: imagePromptOutputParser.getFormatInstructions(),
        },
      }
    ),
  });
  const imagePromptText = await imagePromptChain.call({
    bibleReading: devo.bibleReading,
    summary: devo.summary,
    reflection: devo.reflection,
    prayer: devo.prayer,
  });
  console.log("Image prompts:", imagePromptText.text);
  const imagePrompts = await imagePromptOutputParser.parse(
    imagePromptText.text
  );

  const imageCaptionChain = new LLMChain({
    llm: getPromptModel(1.5), // Temperature can be higher here for more creative captions
    prompt:
      PromptTemplate.fromTemplate(`Generate a caption for the image that would be generated by this prompt:
{imagePrompt}`),
  });
  const imageCaption = await imageCaptionChain.call({
    imagePrompt: imagePrompts.prompt,
  });
  console.log("Image caption:", imageCaption.text);

  const replicate = new Replicate({
    auth: replicateConfig.apiKey,
  });
  const output = await replicate.run(replicateConfig.imageModel, {
    input: {
      prompt: `${imagePrompts.prompt}. 8k, beautiful, high-quality, realistic.`,
      negative_prompt: `${imagePrompts.negativePrompt}. Ugly, unrealistic, blurry, fake, cartoon, text, words, extra fingers, extra toes, extra limbs.`,
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
        caption: imageCaption.text,
        prompt: imagePrompts.prompt,
        negativePrompt: imagePrompts.negativePrompt,
      });
    } catch (e) {
      console.error("Error saving devotion image", e);
    }
  }
}

async function getRandomBibleReading() {
  const vectorStore = await getDocumentVectorStore();
  const bibleReadingChain = RetrievalQAChain.fromLLM(
    getCompletionsModel(0.5), // Temperature needs to be lower here for the more concise response
    vectorStore.asRetriever(10),
    {
      returnSourceDocuments: true,
      inputKey: "prompt",
    }
  );

  const bibleReadingOutputParser = StructuredOutputParser.fromZodSchema(
    z.object({
      book: z.string().describe("The book from within the bible"),
      chapter: z.string().describe("The chapter number from within the book"),
      verseRange: z
        .string()
        .regex(/(\d+)(-(\d+))?/)
        .describe("The verse range"),
      text: z.string().describe("The text of the bible reading"),
    })
  );

  const topic = getRandomTopic();
  console.log(`Devotion topic: ${topic}`);
  const formatInstructions = bibleReadingOutputParser.getFormatInstructions();
  console.log(`Format instructions: ${formatInstructions}`);
  const bibleReading = await bibleReadingChain.call({
    prompt: `Find a bible passage that is between 1 and 15 verses long about ${topic}\n\n${formatInstructions}`,
  });
  const bibleReadingOutput = await bibleReadingOutputParser.parse(
    bibleReading.text
  );
  const bibleReadingText = `${bibleReadingOutput.book} ${bibleReadingOutput.chapter}:${bibleReadingOutput.verseRange} - ${bibleReadingOutput.text}`;
  console.log(`Bible reading: ${bibleReadingText}`);

  return bibleReadingText;
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
