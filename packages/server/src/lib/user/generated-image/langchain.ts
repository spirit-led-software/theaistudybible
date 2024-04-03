import { StringOutputParser } from '@langchain/core/output_parsers';
import { Runnable, RunnableSequence } from '@langchain/core/runnables';
import { llmCache } from '@lib/cache';
import envConfig from '@revelationsai/core/configs/env';
import type { NeonVectorStoreDocument } from '@revelationsai/core/langchain/vectorstores/neon';
import { XMLBuilder } from 'fast-xml-parser';
import {
  CustomListOutputParser,
  JsonMarkdownStructuredOutputParser
} from 'langchain/output_parsers';
import { z } from 'zod';
import { RAIOutputFixingParser } from '../../langchain/output_parsers/rai-output-fixing';
import { getLanguageModel } from '../../llm';
import { getDocumentVectorStore } from '../../vector-db';
import {
  getImagePromptChainPromptInfo,
  getPromptValidatorPromptInfo,
  getSearchQueryPromptInfo
} from './prompts';

const validationOutputParser = RAIOutputFixingParser.fromParser(
  JsonMarkdownStructuredOutputParser.fromZodSchema(
    z.object({
      inappropriate: z.boolean()
    })
  )
);

const searchQueryOutputParser = RAIOutputFixingParser.fromParser(
  new CustomListOutputParser({ separator: '\n' })
);

export const getImagePromptChain = async (): Promise<
  Runnable<
    { userPrompt: string },
    {
      prompt: string;
      sourceDocuments: NeonVectorStoreDocument[];
      searchQueries: string[];
    }
  >
> => {
  const retriever = await getDocumentVectorStore({
    verbose: envConfig.isLocal
  }).then((store) =>
    store.asRetriever({
      k: 3,
      verbose: envConfig.isLocal
    })
  );

  const { prompt: promptValidatorPrompt, stopSequences: promptValidatorStopSequences } =
    await getPromptValidatorPromptInfo({
      formatInstructions: validationOutputParser.getFormatInstructions()
    });
  const { prompt: searchQueryPrompt, stopSequences: searchQueryStopSequences } =
    await getSearchQueryPromptInfo({
      formatInstructions: searchQueryOutputParser.getFormatInstructions()
    });
  const { prompt: promptGeneratorPrompt, stopSequences: promptGeneratorStopSequences } =
    await getImagePromptChainPromptInfo();
  const chain = RunnableSequence.from([
    {
      userPrompt: (input) => input.userPrompt,
      validation: promptValidatorPrompt
        .pipe(
          getLanguageModel({
            cache: llmCache,
            stopSequences: promptValidatorStopSequences
          })
        )
        .pipe(validationOutputParser)
    },
    {
      validation: (previousStepResult) => {
        if (previousStepResult.validation.inappropriate) {
          throw new Error('The prompt that was provided is inappropriate.');
        }
      },
      userPrompt: (previousStepResult) => previousStepResult.userPrompt
    },
    {
      searchQueries: searchQueryPrompt
        .pipe(
          getLanguageModel({
            cache: llmCache,
            stopSequences: searchQueryStopSequences
          })
        )
        .pipe(searchQueryOutputParser),
      userPrompt: (previousStepResult) => previousStepResult.userPrompt
    },
    {
      sourceDocuments: async (previousStepResult: { searchQueries: string[] }) => {
        const searchQueries = previousStepResult.searchQueries;
        const sourceDocuments = await Promise.all(
          searchQueries.map(async (query) => {
            return (await retriever.getRelevantDocuments(query)) as NeonVectorStoreDocument[];
          })
        );
        return sourceDocuments
          .flat()
          .filter((doc, index, self) => index === self.findIndex((d) => d.id === doc.id))
          .map((doc) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { embedding, ...rest } = doc;
            return rest;
          });
      },
      searchQueries: (previousStepResult) => previousStepResult.searchQueries,
      userPrompt: (input) => input.userPrompt
    },
    {
      sources: (previousStepResult: { sourceDocuments: NeonVectorStoreDocument[] }) =>
        previousStepResult.sourceDocuments
          .reduce((acc, doc) => {
            const existingDoc = acc.find((d) => d.metadata.url === doc.metadata.url);
            if (existingDoc) {
              existingDoc.pageContent += `\n${doc.pageContent}`;
            } else {
              acc.push(doc);
            }
            return acc;
          }, [] as NeonVectorStoreDocument[])
          .sort((a, b) => (b.distance && a.distance ? a.distance - b.distance : 0))
          .map((sourceDoc) =>
            new XMLBuilder().build({
              source: {
                source_title: sourceDoc.metadata.title ?? sourceDoc.metadata.name,
                source_author: sourceDoc.metadata.author,
                source_content: sourceDoc.pageContent
              }
            })
          )
          .join('\n'),
      sourceDocuments: (previousStepResult) => previousStepResult.sourceDocuments,
      searchQueries: (previousStepResult) => previousStepResult.searchQueries,
      userPrompt: (previousStepResult) => previousStepResult.userPrompt
    },
    {
      prompt: promptGeneratorPrompt
        .pipe(
          getLanguageModel({
            stopSequences: promptGeneratorStopSequences
          })
        )
        .pipe(new StringOutputParser()),
      sourceDocuments: (previousStepResult) => previousStepResult.sourceDocuments,
      searchQueries: (previousStepResult) => previousStepResult.searchQueries
    }
  ]);

  return chain;
};
