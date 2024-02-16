import { StringOutputParser } from '@langchain/core/output_parsers';
import { Runnable, RunnableSequence } from '@langchain/core/runnables';
import envConfig from '@revelationsai/core/configs/env';
import { devotions } from '@revelationsai/core/database/schema';
import type { NeonVectorStoreDocument } from '@revelationsai/core/langchain/vectorstores/neon';
import { desc, eq } from 'drizzle-orm';
import type { Document } from 'langchain/document';
import { JsonMarkdownStructuredOutputParser, OutputFixingParser } from 'langchain/output_parsers';
import { PromptTemplate } from 'langchain/prompts';
import { z } from 'zod';
import { getDevotions } from '../../services/devotion/devotion';
import { getLanguageModel } from '../../services/llm';
import { OUTPUT_FIXER_PROMPT_TEMPLATE } from '../../services/llm/prompts';
import { getDocumentVectorStore } from '../../services/vector-db';
import {
  DEVO_BIBLE_READING_CHAIN_PROMPT_TEMPLATE,
  DEVO_GENERATOR_CHAIN_PROMPT_TEMPLATE,
  DEVO_IMAGE_CAPTION_CHAIN_PROMPT_TEMPLATE,
  DEVO_IMAGE_PROMPT_CHAIN_PROMPT_TEMPLATE
} from './prompts';

const devotionOutputParser = OutputFixingParser.fromLLM(
  getLanguageModel({
    promptSuffix: '\nPlace your output within <output></output> XML tags.\n<output>',
    stopSequences: ['</output>'],
    temperature: 0.1,
    topK: 5,
    topP: 0.1
  }),
  JsonMarkdownStructuredOutputParser.fromZodSchema(
    z.object({
      summary: z
        .string()
        .describe('A summary of the bible reading. Between 2000 and 3000 characters in length.'),
      reflection: z
        .string()
        .describe(
          'A reflection on the bible reading and summary. Between 3000 and 4000 characters in length.'
        ),
      prayer: z
        .string()
        .describe('A prayer to end the devotion. Between 500 and 2000 characters in length.')
    })
  ),
  {
    prompt: PromptTemplate.fromTemplate(OUTPUT_FIXER_PROMPT_TEMPLATE)
  }
);

export const getDevotionGeneratorChain = async (): Promise<
  Runnable<
    {
      topic: string;
      bibleReading: string;
    },
    {
      result: {
        summary: string;
        reflection: string;
        prayer: string;
      };
      sourceDocuments: NeonVectorStoreDocument[];
    }
  >
> => {
  const retriever = await getDocumentVectorStore({
    verbose: envConfig.isLocal,
    filters: [
      {
        category: 'bible',
        translation: 'ESV'
      },
      "metadata->>'category' != 'bible'"
    ]
  }).then((store) =>
    store.asRetriever({
      k: 10,
      verbose: envConfig.isLocal
    })
  );
  const chain = RunnableSequence.from([
    {
      sourceDocuments: RunnableSequence.from([
        (input) => `Additional information to support:\n${input.topic}\n${input.bibleReading}`,
        retriever
      ]),
      bibleReading: (input) => input.bibleReading,
      topic: (input) => input.topic
    },
    {
      sourceDocuments: (previousStepResult) => previousStepResult.sourceDocuments,
      documents: (previousStepResult) =>
        previousStepResult.sourceDocuments
          .map((d: Document) => `<document>\n${d.pageContent}\n</document>`)
          .join('\n'),
      bibleReading: (previousStepResult) => previousStepResult.bibleReading,
      topic: (previousStepResult) => previousStepResult.topic
    },
    {
      sourceDocuments: (previousStepResult) => previousStepResult.sourceDocuments,
      result: new PromptTemplate({
        template: DEVO_GENERATOR_CHAIN_PROMPT_TEMPLATE,
        inputVariables: ['topic', 'bibleReading', 'documents'],
        partialVariables: {
          formatInstructions: devotionOutputParser.getFormatInstructions()
        }
      })
        .pipe(
          getLanguageModel({
            modelId: 'anthropic.claude-v2:1',
            maxTokens: 4096,
            promptSuffix: '\nPlace your output within <output></output> XML tags.\n<output>',
            stopSequences: ['</output>']
          })
        )
        .pipe(devotionOutputParser)
    }
  ]);

  return chain;
};

const bibleReadingOutputParser = OutputFixingParser.fromLLM(
  getLanguageModel({
    promptSuffix: '\nPlace your output within <output></output> XML tags.\n<output>',
    stopSequences: ['</output>'],
    temperature: 0.1,
    topK: 5,
    topP: 0.1
  }),
  JsonMarkdownStructuredOutputParser.fromZodSchema(
    z.object({
      book: z.string().describe('The book name from within the bible. For example: Genesis'),
      chapter: z
        .string()
        .describe(
          'The chapter number from within the book. For example: 1. **PUT IN STRING FORMAT**'
        ),
      verseRange: z
        .string()
        .regex(/(\d+)(-(\d+))?/g) // Ex: 1 or 1-3
        .describe('The verse range. For example: 1 or 1-3. **PUT IN STRING FORMAT**'),
      text: z.string().describe('The exact text of the bible reading.')
    })
  ),
  {
    prompt: PromptTemplate.fromTemplate(OUTPUT_FIXER_PROMPT_TEMPLATE)
  }
);

export const getBibleReadingChain = async (topic: string) => {
  const retriever = await getDocumentVectorStore({
    filters: [
      {
        category: 'bible',
        translation: 'ESV'
      }
    ],
    verbose: envConfig.isLocal
  }).then((store) =>
    store.asRetriever({
      k: 50,
      verbose: envConfig.isLocal
    })
  );
  const chain = RunnableSequence.from([
    {
      sourceDocuments: RunnableSequence.from([
        (input: { topic: string }) => input.topic,
        retriever
      ]),
      topic: (input: { topic: string }) => input.topic
    },
    {
      documents: (previousStepResult: { sourceDocuments: Document[] }) =>
        previousStepResult.sourceDocuments
          .map((d: Document) => `<document>\n${d.pageContent}\n</document>`)
          .join('\n'),
      topic: (previousStepResult: { topic: string }) => previousStepResult.topic
    },
    new PromptTemplate({
      template: DEVO_BIBLE_READING_CHAIN_PROMPT_TEMPLATE,
      inputVariables: ['topic', 'documents'],
      partialVariables: {
        previousBibleReadings: (
          await getDevotions({
            limit: 10,
            orderBy: desc(devotions.createdAt),
            where: eq(devotions.topic, topic)
          })
        )
          .map((d) => `<off_limits_bible_reading>\n${d.bibleReading}\n</off_limits_bible_reading>`)
          .join('\n'),
        formatInstructions: bibleReadingOutputParser.getFormatInstructions()
      }
    })
      .pipe(
        getLanguageModel({
          maxTokens: 2048,
          promptSuffix: '\nPlace your output within <output></output> XML tags.\n<output>',
          stopSequences: ['</output>']
        })
      )
      .pipe(bibleReadingOutputParser)
  ]);

  return chain;
};

const imagePromptOutputParser = OutputFixingParser.fromLLM(
  getLanguageModel({
    promptSuffix: '\nPlace your output within <output></output> XML tags.\n<output>',
    stopSequences: ['</output>'],
    temperature: 0.1,
    topK: 5,
    topP: 0.1
  }),
  JsonMarkdownStructuredOutputParser.fromZodSchema(z.array(z.string())),
  {
    prompt: PromptTemplate.fromTemplate(OUTPUT_FIXER_PROMPT_TEMPLATE)
  }
);

export const getImagePromptChain = () => {
  return new PromptTemplate({
    template: DEVO_IMAGE_PROMPT_CHAIN_PROMPT_TEMPLATE,
    inputVariables: ['bibleReading', 'summary', 'reflection', 'prayer'],
    partialVariables: {
      formatInstructions: imagePromptOutputParser.getFormatInstructions()
    }
  })
    .pipe(
      getLanguageModel({
        maxTokens: 1024,
        stream: false,
        promptSuffix: '\nPlace your output within <output></output> XML tags.\n<output>',
        stopSequences: ['</output>']
      })
    )
    .pipe(imagePromptOutputParser);
};

export const getImageCaptionChain = () => {
  return PromptTemplate.fromTemplate(DEVO_IMAGE_CAPTION_CHAIN_PROMPT_TEMPLATE)
    .pipe(
      getLanguageModel({
        modelId: 'anthropic.claude-v2:1',
        maxTokens: 100,
        stream: false,
        promptSuffix: '\nPlace your output within <output></output> XML tags.\n<output>',
        stopSequences: ['</output>']
      })
    )
    .pipe(new StringOutputParser());
};
