import { StringOutputParser } from '@langchain/core/output_parsers';
import { Runnable, RunnableSequence } from '@langchain/core/runnables';
import type { Devotion } from '@theaistudybible/core/model/devotion';
import { RAIOutputFixingParser } from '@theaistudybible/langchain/output_parsers/rai-output-fixing';
import type { UpstashVectorStoreDocument } from '@theaistudybible/langchain/vectorstores/upstash';
import type { Document } from 'langchain/document';
import { JsonMarkdownStructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';
import { getLanguageModel } from '../llm';
import {
  getBibleReadingFinderPromptInfo,
  getDevoGeneratorPromptInfo,
  getImageCaptionPromptInfo,
  getImagePromptChainPromptInfo
} from '../prompts/devotion';
import { getDocumentVectorStore } from '../vector-db';

const devotionOutputParser = RAIOutputFixingParser.fromParser(
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
  )
);

const bibleReadingOutputParser = RAIOutputFixingParser.fromParser(
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
  )
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
      sourceDocuments: UpstashVectorStoreDocument[];
    }
  >
> => {
  const retriever = await getDocumentVectorStore({
    verbose: process.env.IS_LOCAL === 'true',
    filter: "(category = 'bible' AND translation = 'ESV') OR category != 'bible'"
  }).then((store) =>
    store.asRetriever({
      k: 10,
      verbose: process.env.IS_LOCAL === 'true'
    })
  );

  const { prompt, stopSequences } = await getDevoGeneratorPromptInfo({
    formatInstructions: devotionOutputParser.getFormatInstructions()
  });
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
      result: prompt
        .pipe(
          getLanguageModel({
            modelId: 'claude-3-opus-20240229',
            stopSequences
          })
        )
        .pipe(devotionOutputParser)
    }
  ]);

  return chain;
};

export const getBibleReadingChain = async (topic: string, previousDevotions: Devotion[]) => {
  const retriever = await getDocumentVectorStore({
    filter: "category = 'bible' AND translation = 'ESV'",
    verbose: process.env.IS_LOCAL === 'true'
  }).then((store) =>
    store.asRetriever({
      k: 50,
      verbose: process.env.IS_LOCAL === 'true'
    })
  );

  const { prompt, stopSequences } = await getBibleReadingFinderPromptInfo({
    formatInstructions: bibleReadingOutputParser.getFormatInstructions(),
    previousBibleReadings: previousDevotions
      .map((d) => `<off_limits_bible_reading>\n${d.bibleReading}\n</off_limits_bible_reading>`)
      .join('\n')
  });
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
    prompt
      .pipe(
        getLanguageModel({
          modelId: 'claude-3-haiku-20240307',
          stopSequences
        })
      )
      .pipe(bibleReadingOutputParser)
  ]);

  return chain;
};

export const getImagePromptChain = () => {
  const { prompt, stopSequences } = getImagePromptChainPromptInfo();
  return prompt
    .pipe(
      getLanguageModel({
        stopSequences
      })
    )
    .pipe(new StringOutputParser());
};

export const getImageCaptionChain = () => {
  const { prompt, stopSequences } = getImageCaptionPromptInfo();
  return prompt
    .pipe(
      getLanguageModel({
        stopSequences
      })
    )
    .pipe(new StringOutputParser());
};
