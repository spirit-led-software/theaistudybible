import { StringOutputParser } from '@langchain/core/output_parsers';
import { Runnable, RunnableSequence } from '@langchain/core/runnables';
import envConfig from '@revelationsai/core/configs/environment';
import { llmCache } from '@revelationsai/langchain/lib/cache';
import { RAIOutputFixingParser } from '@revelationsai/langchain/output_parsers/rai-output-fixing';
import type { UpstashVectorStoreDocument } from '@revelationsai/langchain/vectorstores/upstash';
import { XMLBuilder } from 'fast-xml-parser';
import {
  CustomListOutputParser,
  JsonMarkdownStructuredOutputParser
} from 'langchain/output_parsers';
import { z } from 'zod';
import { getLanguageModel } from '../llm';
import {
  getImagePromptChainPromptInfo,
  getPromptValidatorPromptInfo,
  getSearchQueryPromptInfo
} from '../prompts/generated-image';
import { getDocumentVectorStore } from '../vector-db';

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
      sourceDocuments: UpstashVectorStoreDocument[];
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
            return (await retriever.getRelevantDocuments(query)) as UpstashVectorStoreDocument[];
          })
        );
        return sourceDocuments
          .flat()
          .filter((doc, index, self) => index === self.findIndex((d) => d.id === doc.id))
          .map((doc) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { vector, ...rest } = doc;
            return rest;
          });
      },
      searchQueries: (previousStepResult) => previousStepResult.searchQueries,
      userPrompt: (input) => input.userPrompt
    },
    {
      sources: (previousStepResult: { sourceDocuments: UpstashVectorStoreDocument[] }) =>
        previousStepResult.sourceDocuments
          .reduce((acc, doc) => {
            const existingDoc = acc.find((d) => d.metadata.url === doc.metadata.url);
            if (existingDoc) {
              existingDoc.pageContent += `\n${doc.pageContent}`;
            } else {
              acc.push(doc);
            }
            return acc;
          }, [] as UpstashVectorStoreDocument[])
          .sort((a, b) => (b.score && a.score ? a.score - b.score : 0))
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
