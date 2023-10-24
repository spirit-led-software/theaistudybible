import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { axios, replicateConfig, s3Config } from "@core/configs";
import type { NeonVectorStoreDocument } from "@core/langchain/vectorstores/neon";
import type {
  CreateDevotionData,
  Devotion,
  UpdateDevotionData,
} from "@core/model";
import { devotions, devotionsToSourceDocuments } from "@core/schema";
import { readOnlyDatabase, readWriteDatabase } from "@lib/database";
import { SQL, desc, eq } from "drizzle-orm";
import { LLMChain, RetrievalQAChain } from "langchain/chains";
import { StructuredOutputParser } from "langchain/output_parsers";
import { PromptTemplate } from "langchain/prompts";
import Replicate from "replicate";
import { z } from "zod";
import { getLargeContextModel } from "../llm";
import { getDocumentVectorStore } from "../vector-db";
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

  const vectorStore = await getDocumentVectorStore();
  const foundSourceDocuments = await vectorStore.getDocumentsByIds(
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

export async function generateDevotion(topic?: string, bibleReading?: string) {
  let devo: Devotion | undefined;
  try {
    if (!topic || !bibleReading) {
      const { bibleReadingText, topic: newTopic } =
        await getRandomBibleReading();
      topic = newTopic;
      bibleReading = bibleReadingText;
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

    const vectorStore = await getDocumentVectorStore();
    const chain = RetrievalQAChain.fromLLM(
      getLargeContextModel({
        modelId: "anthropic.claude-v2",
        maxTokens: 4096,
        stopSequences: ["</output>"],
        promptSuffix: "<output>",
      }),
      vectorStore.asRetriever(25),
      {
        prompt: PromptTemplate.fromTemplate(
          `You need to write a non-denominational Christian devotion based on the following context and Bible reading. Your output should match the formatting instructions exactly.

          The context is within <context></context> XML tags.
          The Bible reading is within <bible_reading></bible_reading> XML tags.
          The formatting instructions are within <format_instructions></format_instructions> XML tags.

          <context>
          {context}
          </context>

          <bible_reading>
          {question}
          </bible_reading>

          <format_instructions>
          {formatInstructions}
          </format_instructions>

          Put your output that follows the formatting instructions within <output></output> XML tags.`,
          {
            partialVariables: {
              formatInstructions: outputParser.getFormatInstructions(),
            },
          }
        ),
        returnSourceDocuments: true,
        inputKey: "bibleReading",
      }
    );
    const result = await chain.call({
      bibleReading,
    });

    const output = await outputParser.parse(result.text);
    devo = await createDevotion({
      topic,
      bibleReading,
      summary: output.summary,
      reflection: output.reflection,
      prayer: output.prayer,
    });

    await Promise.all(
      result.sourceDocuments.map(async (c: NeonVectorStoreDocument) => {
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
    llm: getLargeContextModel({
      maxTokens: 1024,
      stream: false,
      stopSequences: ["</output>"],
      promptSuffix: "<output>",
    }),
    prompt: PromptTemplate.fromTemplate(
      `Create an image generation prompt and a negative image generation prompt. Do not be verbose. Start with what should or shouldn't be in the image and then follow it with adjectives to describe the image. Base it on the devotion below. Some examples of prompts are also given below. Your output should match the formatting instructions exactly.
      
      The examples are given within <examples></examples> XML tags.
      The devotion is within <devotion></devotion> XML tags.
      The formatting instructions are within <format_instructions></format_instructions> XML tags.
      
      <examples>
      Prompt: A beautiful sunset over the ocean with seagulls flying overhead. 8k, beautiful, high-quality, realistic.
      Negative prompt: A dark night. Ugly, unrealistic, blurry, fake, cartoon, text, words, extra fingers, extra toes, extra limbs.
      </examples>
      
      <devotion>
      Bible Reading:\n{bibleReading}\n\n
      Summary:\n{summary}\n\n
      Reflection:\n{reflection}\n\n
      Prayer:\n{prayer}\n\n
      </devotion>

      <format_instructions>
      {formatInstructions}
      </format_instructions>
      
      Put your output that follows the formatting instructions within <output></output> XML tags.`,
      {
        partialVariables: {
          formatInstructions: imagePromptOutputParser.getFormatInstructions(),
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
    llm: getLargeContextModel({
      maxTokens: 100,
      stream: false,
      stopSequences: ["</output>"],
      promptSuffix: "<output>",
    }),
    prompt: PromptTemplate.fromTemplate(
      `Generate a caption for the image that would be generated by the following prompt and devotion. Your caption should not be more than 100 words in length.

      The prompt is within <prompt></prompt> XML tags.
      The devotion is within <devotion></devotion> XML tags.

      <prompt>
      {imagePrompt}
      </prompt>

      <devotion>
      Bible Reading:\n{bibleReading}\n\n
      Summary:\n{summary}\n\n
      Reflection:\n{reflection}\n\n
      Prayer:\n{prayer}\n
      </devotion>
      
      Put the caption you come up with within <output></output> XML tags.`
    ),
  });
  const imageCaption = await imageCaptionChain.call({
    imagePrompt: imagePrompts.prompt,
    bibleReading: devo.bibleReading,
    summary: devo.summary,
    reflection: devo.reflection,
    prayer: devo.prayer,
  });
  console.log("Image caption:", imageCaption.text);

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
  const bibleReadingOutputParser = StructuredOutputParser.fromZodSchema(
    z.object({
      book: z
        .string()
        .describe("The book name from within the bible. For example: Genesis"),
      chapter: z
        .string()
        .describe("The chapter number from within the book. For example: 1"),
      verseRange: z
        .string()
        .regex(/(\d+)(-(\d+))?/)
        .describe("The verse range. For example: 1-3"),
      text: z.string().describe("The exact text of the bible reading."),
    })
  );

  const vectorStore = await getDocumentVectorStore();
  const bibleReadingChain = RetrievalQAChain.fromLLM(
    getLargeContextModel({
      modelId: "anthropic.claude-instant-v1",
      stream: false,
      maxTokens: 2048,
      stopSequences: ["</output>"],
      promptSuffix: "<output>",
    }),
    vectorStore.asRetriever(50),
    {
      prompt: PromptTemplate.fromTemplate(
        `You need to find a Bible reading within the following context and based on the following topic. Your output should match the formatting instructions exactly. Make sure that the bible reading does not resemble too closely any of the previous bible readings.

        The previous bible readings are within <previous_bible_readings></previous_bible_readings> XML tags.
        The context is within <context></context> XML tags.
        The topic is within <topic></topic> XML tags.
        The formatting instructions are within <format_instructions></format_instructions> XML tags.

        <previous_bible_readings>
        {previousBibleReadings}
        </previous_bible_readings>

        <context>
        {context}
        </context>

        <topic>
        {question}
        </topic>

        <format_instructions>
        {formatInstructions}
        </format_instructions>

        Put your output that follows the formatting instructions within <output></output> XML tags.`,
        {
          partialVariables: {
            previousBibleReadings: (
              await getDevotions({
                limit: 5,
                orderBy: desc(devotions.createdAt),
              })
            )
              .map((d) => d.bibleReading)
              .join("\n"),
            formatInstructions:
              bibleReadingOutputParser.getFormatInstructions(),
          },
        }
      ),
      returnSourceDocuments: true,
      inputKey: "topic",
    }
  );

  const topic = getRandomTopic();
  console.log(`Devotion topic: ${topic}`);
  const bibleReading = await bibleReadingChain.call({
    topic,
  });

  const bibleReadingOutput = await bibleReadingOutputParser.parse(
    bibleReading.text
  );
  const bibleReadingText = `${bibleReadingOutput.book} ${bibleReadingOutput.chapter}:${bibleReadingOutput.verseRange} - ${bibleReadingOutput.text}`;
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
