import { StringOutputParser } from '@langchain/core/output_parsers';
import { Runnable, RunnableBranch, RunnableSequence } from '@langchain/core/runnables';
import envConfig from '@revelationsai/core/configs/env';
import {
  anthropicModelIds,
  type AnthropicModelId
} from '@revelationsai/core/langchain/types/bedrock';
import type { NeonVectorStoreDocument } from '@revelationsai/core/langchain/vectorstores/neon';
import type { RAIChatMessage } from '@revelationsai/core/model/chat/message';
import {
  allModels,
  type FreeTierModelId,
  type PlusTierModelId
} from '@revelationsai/core/model/llm';
import type { User } from '@revelationsai/core/model/user';
import type { Metadata } from '@revelationsai/core/types/metadata';
import { XMLBuilder } from 'fast-xml-parser';
import type { CallbackManager } from 'langchain/callbacks';
import {
  CustomListOutputParser,
  OutputFixingParser,
  RouterOutputParser
} from 'langchain/output_parsers';
import { PromptTemplate } from 'langchain/prompts';
import type { PartialValues } from 'langchain/schema';
import { z } from 'zod';
import { getLanguageModel, llmCache } from '../llm';
import { OUTPUT_FIXER_PROMPT_TEMPLATE } from '../llm/prompts';
import { getDocumentVectorStore } from '../vector-db';
import {
  CHAT_FAITH_QA_CHAIN_PROMPT_TEMPLATE,
  CHAT_HISTORY_CHAIN_PROMPT_TEMPLATE,
  CHAT_IDENTITY_CHAIN_PROMPT_TEMPLATE,
  CHAT_ROUTER_CHAIN_PROMPT_TEMPLATE,
  CHAT_SEARCH_QUERY_CHAIN_PROMPT_TEMPLATE
} from './prompts';

export const getRAIChatChain = async (options: {
  modelId: FreeTierModelId | PlusTierModelId;
  user: User;
  messages: RAIChatMessage[];
  callbacks: CallbackManager;
}): Promise<
  Runnable<
    { query: string },
    {
      text: string;
      sourceDocuments?: NeonVectorStoreDocument[];
      searchQueries?: string[];
    }
  >
> => {
  const { modelId, user, callbacks } = options;

  const { contextSize } = allModels[modelId];
  const contextSizeNum = parseInt(contextSize.substring(0, contextSize.indexOf('k')));

  const messages = options.messages.slice(contextSizeNum > 32 ? -21 : -11, -1);
  const history = messages
    .map((m) => new XMLBuilder().build({ message: { sender: m.role, text: m.content } }))
    .join('\n');

  const identityChain = RunnableSequence.from([
    {
      query: (input) => input.routingInstructions.next_inputs.query
    },
    {
      text: PromptTemplate.fromTemplate(CHAT_IDENTITY_CHAIN_PROMPT_TEMPLATE, {
        partialVariables: {
          history
        }
      })
        .pipe(
          getLanguageModel({
            modelId,
            stream: true,
            ...(anthropicModelIds.includes(modelId as AnthropicModelId) && {
              promptSuffix: '\nPlace your answer within <answer></answer> XML tags.',
              completionPrefix: '<answer>',
              stopSequences: ['</answer>']
            })
          })
        )
        .pipe(new StringOutputParser())
        .withConfig({
          callbacks
        })
    }
  ]);

  const chatHistoryChain = RunnableSequence.from([
    {
      query: (input) => input.routingInstructions.next_inputs.query
    },
    {
      text: PromptTemplate.fromTemplate(CHAT_HISTORY_CHAIN_PROMPT_TEMPLATE, {
        partialVariables: {
          history
        }
      })
        .pipe(
          getLanguageModel({
            modelId,
            stream: true,
            ...(anthropicModelIds.includes(modelId as AnthropicModelId) && {
              promptSuffix: '\nPlace your answer within <answer></answer> XML tags.',
              completionPrefix: '<answer>',
              stopSequences: ['</answer>']
            })
          })
        )
        .pipe(new StringOutputParser())
        .withConfig({
          callbacks
        })
    }
  ]);

  const faithQaChain = await getDocumentQaChain({
    modelId,
    contextSize: contextSizeNum,
    prompt: CHAT_FAITH_QA_CHAIN_PROMPT_TEMPLATE,
    filters: [
      {
        category: 'bible',
        translation: user.translation
      },
      "metadata->>'category' != 'bible'"
    ],
    history,
    extraPromptVars: {
      bibleTranslation: user.translation
    },
    callbacks
  });

  const branch = RunnableBranch.from([
    [(x) => x.routingInstructions.destination === 'identity', identityChain],
    [(x) => x.routingInstructions.destination === 'chat-history', chatHistoryChain],
    [(x) => x.routingInstructions.destination === 'faith-qa', faithQaChain],
    faithQaChain
  ]);

  const routerChainOutputParser = OutputFixingParser.fromLLM(
    getLanguageModel({
      temperature: 0.1,
      topK: 5,
      topP: 0.1
    }),
    RouterOutputParser.fromZodSchema(
      z.object({
        destination: z
          .string()
          .optional()
          .describe(
            'The name of the question answering system to use. This can just be "DEFAULT" without the quotes if you do not know which system is best.'
          ),
        next_inputs: z
          .object({
            query: z.string().describe('The query to be fed into the next model.')
          })
          .describe('The input to be fed into the next model.')
      })
    ),
    {
      prompt: PromptTemplate.fromTemplate(OUTPUT_FIXER_PROMPT_TEMPLATE)
    }
  );
  const multiRouteChain = RunnableSequence.from([
    {
      routingInstructions: RunnableSequence.from([
        new PromptTemplate({
          template: CHAT_ROUTER_CHAIN_PROMPT_TEMPLATE,
          inputVariables: ['query'],
          partialVariables: {
            formatInstructions: routerChainOutputParser.getFormatInstructions(),
            destinations: [
              'identity: For greetings, introducing yourself, or talking about yourself.',
              'chat-history: For retrieving information about the current chat conversation.',
              'faith-qa: For answering general queries about Christian faith.'
            ].join('\n'),
            history: messages
              .slice(-10)
              .map((m) => new XMLBuilder().build({ message: { sender: m.role, text: m.content } }))
              .join('\n')
          }
        }),
        getLanguageModel({
          cache: llmCache
        }),
        routerChainOutputParser
      ]),
      input: (input) => input.query
    },
    branch
  ]);

  return multiRouteChain;
};

const searchQueryOutputParser = OutputFixingParser.fromLLM(
  getLanguageModel({
    temperature: 0.1,
    topK: 5,
    topP: 0.1
  }),
  new CustomListOutputParser({ separator: '\n' }),
  {
    prompt: PromptTemplate.fromTemplate(OUTPUT_FIXER_PROMPT_TEMPLATE)
  }
);

export async function getDocumentQaChain(options: {
  modelId: FreeTierModelId | PlusTierModelId;
  contextSize: number;
  prompt: string;
  callbacks: CallbackManager;
  filters?: (Metadata | string)[];
  history: string;
  extraPromptVars?: PartialValues<string>;
}) {
  const { modelId, contextSize, prompt, filters, extraPromptVars, history, callbacks } = options;
  const qaRetriever = await getDocumentVectorStore({
    filters,
    verbose: envConfig.isLocal
  }).then((store) =>
    store.asRetriever({
      k: contextSize > 32 ? 15 : 8,
      verbose: envConfig.isLocal
    })
  );

  const qaChain = RunnableSequence.from([
    {
      query: (input) => input.routingInstructions.next_inputs.query
    },
    {
      searchQueries: PromptTemplate.fromTemplate(CHAT_SEARCH_QUERY_CHAIN_PROMPT_TEMPLATE, {
        partialVariables: {
          history,
          formatInstructions: searchQueryOutputParser.getFormatInstructions()
        }
      })
        .pipe(
          getLanguageModel({
            cache: llmCache
          })
        )
        .pipe(searchQueryOutputParser),
      query: (previousStepResult) => previousStepResult.query
    },
    {
      sourceDocuments: async (previousStepResult: { searchQueries: string[] }) => {
        const searchQueries = previousStepResult.searchQueries;
        const sourceDocuments = await Promise.all(
          searchQueries.map(async (query) => {
            return (await qaRetriever.getRelevantDocuments(query)) as NeonVectorStoreDocument[];
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
      query: (previousStepResult) => previousStepResult.query
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
                source_content: sourceDoc.pageContent,
                source_url: sourceDoc.metadata.url
              }
            })
          )
          .join('\n'),
      sourceDocuments: (previousStepResult) => previousStepResult.sourceDocuments,
      searchQueries: (previousStepResult) => previousStepResult.searchQueries,
      query: (previousStepResult) => previousStepResult.query
    },
    {
      text: PromptTemplate.fromTemplate(prompt, {
        partialVariables: {
          history,
          ...extraPromptVars
        }
      })
        .pipe(
          getLanguageModel({
            modelId,
            stream: true,
            ...(anthropicModelIds.includes(modelId as AnthropicModelId) && {
              promptSuffix: '\nPlace your answer within <answer></answer> XML tags.',
              completionPrefix: '<answer>',
              stopSequences: ['</answer>']
            })
          })
        )
        .pipe(new StringOutputParser())
        .withConfig({
          callbacks
        }),
      sourceDocuments: (previousStepResult) => previousStepResult.sourceDocuments,
      searchQueries: (previousStepResult) => previousStepResult.searchQueries
    }
  ]);

  return qaChain;
}
