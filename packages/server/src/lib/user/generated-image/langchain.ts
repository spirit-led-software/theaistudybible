import { Runnable, RunnableSequence } from '@langchain/core/runnables';
import envConfig from '@revelationsai/core/configs/env';
import type { NeonVectorStoreDocument } from '@revelationsai/core/langchain/vectorstores/neon';
import { XMLBuilder } from 'fast-xml-parser';
import {
  CommaSeparatedListOutputParser,
  JsonMarkdownStructuredOutputParser,
  OutputFixingParser
} from 'langchain/output_parsers';
import { PromptTemplate } from 'langchain/prompts';
import { z } from 'zod';
import { getLanguageModel, llmCache } from '../../llm';
import { OUTPUT_FIXER_PROMPT_TEMPLATE } from '../../llm/prompts';
import { getDocumentVectorStore } from '../../vector-db';
import {
  USER_GENERATED_IMAGE_PROMPT_CHAIN_PROMPT_TEMPLATE,
  USER_GENERATED_IMAGE_PROMPT_VALIDATOR_PROMPT_TEMPLATE,
  USER_GENERATED_IMAGE_SEARCH_QUERY_CHAIN_PROMPT_TEMPLATE
} from './prompts';

const validationOutputParser = OutputFixingParser.fromLLM(
  getLanguageModel({
    temperature: 0.1,
    topK: 5,
    topP: 0.1
  }),
  JsonMarkdownStructuredOutputParser.fromZodSchema(
    z.object({
      inappropriate: z.boolean()
    })
  ),
  {
    prompt: PromptTemplate.fromTemplate(OUTPUT_FIXER_PROMPT_TEMPLATE)
  }
);

const phraseOutputParser = OutputFixingParser.fromLLM(
  getLanguageModel({
    temperature: 0.1,
    topK: 5,
    topP: 0.1
  }),
  new CommaSeparatedListOutputParser(),
  {
    prompt: PromptTemplate.fromTemplate(OUTPUT_FIXER_PROMPT_TEMPLATE)
  }
);

export const getImagePromptChain = async (): Promise<
  Runnable<
    { userPrompt: string },
    {
      phrases: string[];
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

  const searchQueryOutputParser = OutputFixingParser.fromLLM(
    getLanguageModel({
      temperature: 0.1,
      topK: 5,
      topP: 0.1
    }),
    new CommaSeparatedListOutputParser(),
    {
      prompt: PromptTemplate.fromTemplate(OUTPUT_FIXER_PROMPT_TEMPLATE)
    }
  );

  const chain = RunnableSequence.from([
    {
      userPrompt: (input) => input.userPrompt,
      validation: new PromptTemplate({
        template: USER_GENERATED_IMAGE_PROMPT_VALIDATOR_PROMPT_TEMPLATE,
        inputVariables: ['userPrompt'],
        partialVariables: {
          formatInstructions: validationOutputParser.getFormatInstructions()
        }
      })
        .pipe(getLanguageModel())
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
      searchQueries: PromptTemplate.fromTemplate(
        USER_GENERATED_IMAGE_SEARCH_QUERY_CHAIN_PROMPT_TEMPLATE,
        {
          partialVariables: {
            formatInstructions: searchQueryOutputParser.getFormatInstructions()
          }
        }
      )
        .pipe(
          getLanguageModel({
            cache: llmCache
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
      phrases: new PromptTemplate({
        template: USER_GENERATED_IMAGE_PROMPT_CHAIN_PROMPT_TEMPLATE,
        inputVariables: ['userPrompt', 'sources'],
        partialVariables: {
          formatInstructions: phraseOutputParser.getFormatInstructions()
        }
      })
        .pipe(getLanguageModel())
        .pipe(phraseOutputParser),
      sourceDocuments: (previousStepResult) => previousStepResult.sourceDocuments,
      searchQueries: (previousStepResult) => previousStepResult.searchQueries
    }
  ]);

  return chain;
};
