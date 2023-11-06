import type { NeonVectorStoreDocument } from "@core/langchain/vectorstores";
import { devotions } from "@core/schema";
import { getLargeContextModel } from "@services/llm";
import { getDocumentVectorStore } from "@services/vector-db";
import { desc } from "drizzle-orm";
import type { Document } from "langchain/document";
import { StructuredOutputParser } from "langchain/output_parsers";
import { PromptTemplate } from "langchain/prompts";
import { StringOutputParser } from "langchain/schema/output_parser";
import { Runnable, RunnableSequence } from "langchain/schema/runnable";
import { z } from "zod";
import { getDevotions } from "./devotion";
import {
  DEVO_BIBLE_READING_CHAIN_PROMPT_TEMPLATE,
  DEVO_GENERATOR_CHAIN_PROMPT_TEMPLATE,
  DEVO_IMAGE_CAPTION_CHAIN_PROMPT_TEMPLATE,
  DEVO_IMAGE_PROMPT_CHAIN_PROMPT_TEMPLATE,
} from "./prompts";

const devotionOutputParser = StructuredOutputParser.fromZodSchema(
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

export const getDevotionGeneratorChain = async (): Promise<
  Runnable<
    any,
    {
      result: typeof devotionOutputParser.schema._type;
      sourceDocuments: NeonVectorStoreDocument[];
    }
  >
> => {
  const retriever = await getDocumentVectorStore().then((store) =>
    store.asRetriever(25)
  );
  const chain = RunnableSequence.from([
    {
      sourceDocuments: RunnableSequence.from([
        (input) => input.bibleReading,
        retriever,
      ]),
      bibleReading: (input) => input.bibleReading,
    },
    {
      sourceDocuments: (previousStepResult) =>
        previousStepResult.sourceDocuments,
      context: (previousStepResult) =>
        previousStepResult.sourceDocuments
          .map((d: Document) => `<document>\n${d.pageContent}\n</document>`)
          .join("\n"),
      bibleReading: (previousStepResult) => previousStepResult.bibleReading,
    },
    {
      sourceDocuments: (previousStepResult) =>
        previousStepResult.sourceDocuments,
      result: new PromptTemplate({
        template: DEVO_GENERATOR_CHAIN_PROMPT_TEMPLATE,
        inputVariables: ["bibleReading", "context"],
        partialVariables: {
          formatInstructions: devotionOutputParser.getFormatInstructions(),
        },
      })
        .pipe(
          getLargeContextModel({
            modelId: "anthropic.claude-v2",
            maxTokens: 4096,
            stopSequences: ["</output>"],
            promptSuffix: "<output>",
          })
        )
        .pipe(devotionOutputParser),
    },
  ]);

  return chain;
};

export const getBibleReadingChain = async () => {
  const outputParser = StructuredOutputParser.fromZodSchema(
    z.object({
      book: z
        .string()
        .describe("The book name from within the bible. For example: Genesis"),
      chapter: z
        .string()
        .describe(
          "The chapter number from within the book. For example: 1. **PUT IN STRING FORMAT**"
        ),
      verseRange: z
        .string()
        .regex(/(\d+)(-(\d+))?/g) // Ex: 1 or 1-3
        .describe(
          "The verse range. For example: 1 or 1-3. **PUT IN STRING FORMAT**"
        ),
      text: z.string().describe("The exact text of the bible reading."),
    })
  );
  const retriever = await getDocumentVectorStore({
    filter: {
      name: "YouVersion - ESV 2016",
    },
  }).then((store) => store.asRetriever(50));
  const chain = RunnableSequence.from([
    {
      sourceDocuments: RunnableSequence.from([
        (input) => input.topic,
        retriever,
      ]),
      topic: (input) => input.topic,
    },
    {
      context: (previousStepResult) =>
        previousStepResult.sourceDocuments
          .map((d: Document) => `<document>\n${d.pageContent}\n</document>`)
          .join("\n"),
      topic: (previousStepResult) => previousStepResult.topic,
    },
    new PromptTemplate({
      template: DEVO_BIBLE_READING_CHAIN_PROMPT_TEMPLATE,
      inputVariables: ["topic", "context"],
      partialVariables: {
        previousBibleReadings: (
          await getDevotions({
            limit: 5,
            orderBy: desc(devotions.createdAt),
          })
        )
          .map((d) => `<previous_bible_reading>\n${d.bibleReading}\n</previous_bible_reading>`)
          .join("\n"),
        formatInstructions: outputParser.getFormatInstructions(),
      },
    })
      .pipe(
        getLargeContextModel({
          modelId: "anthropic.claude-v2",
          maxTokens: 2048,
          stopSequences: ["</output>"],
          promptSuffix: "<output>",
        })
      )
      .pipe(outputParser),
  ]);

  return chain;
};

export const getImagePromptChain = () => {
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
  return new PromptTemplate({
    template: DEVO_IMAGE_PROMPT_CHAIN_PROMPT_TEMPLATE,
    inputVariables: ["bibleReading", "summary", "reflection", "prayer"],
    partialVariables: {
      formatInstructions: imagePromptOutputParser.getFormatInstructions(),
    },
  })
    .pipe(
      getLargeContextModel({
        modelId: "anthropic.claude-v2",
        maxTokens: 1024,
        stream: false,
        promptSuffix: "<output>",
        stopSequences: ["</output>"],
      })
    )
    .pipe(imagePromptOutputParser);
};

export const getImageCaptionChain = () => {
  return PromptTemplate.fromTemplate(DEVO_IMAGE_CAPTION_CHAIN_PROMPT_TEMPLATE)
    .pipe(
      getLargeContextModel({
        modelId: "anthropic.claude-v2",
        maxTokens: 100,
        stream: false,
        promptSuffix: "<output>",
        stopSequences: ["</output>"],
      })
    )
    .pipe(new StringOutputParser());
};
