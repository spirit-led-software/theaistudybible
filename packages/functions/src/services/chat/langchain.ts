import envConfig from '@core/configs/env';
import type { AnthropicModelId } from '@core/langchain/types/bedrock-types';
import type { NeonVectorStoreDocument } from '@core/langchain/vectorstores/neon';
import type { User } from '@core/model/user';
import type { Metadata } from '@core/types/metadata';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Runnable, RunnableBranch, RunnableSequence } from '@langchain/core/runnables';
import { OUTPUT_FIXER_PROMPT_TEMPLATE } from '@services/llm/prompts';
import type { CallbackManager } from 'langchain/callbacks';
import type { Document } from 'langchain/document';
import { ChatMessageHistory } from 'langchain/memory';
import {
  JsonMarkdownStructuredOutputParser,
  OutputFixingParser,
  RouterOutputParser
} from 'langchain/output_parsers';
import { PromptTemplate } from 'langchain/prompts';
import type { PartialValues } from 'langchain/schema';
import { z } from 'zod';
import { getLargeContextModel, llmCache } from '../llm';
import { getDocumentVectorStore } from '../vector-db';
import type { RAIChatMessage } from './message';
import {
  CHAT_FAITH_QA_CHAIN_PROMPT_TEMPLATE,
  CHAT_HISTORY_CHAIN_PROMPT_TEMPLATE,
  CHAT_IDENTITY_CHAIN_PROMPT_TEMPLATE,
  CHAT_ROUTER_CHAIN_PROMPT_TEMPLATE,
  CHAT_SEARCH_QUERY_CHAIN_PROMPT_TEMPLATE
} from './prompts';

export const getRAIChatChain = async (options: {
  modelId: AnthropicModelId;
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
  const { modelId, user, messages, callbacks } = options;

  const history = new ChatMessageHistory(
    messages.slice(-13, -1).map((message) => {
      return message.role === 'user'
        ? new HumanMessage(message.content)
        : new AIMessage(message.content);
    })
  );

  const identityChain = RunnableSequence.from([
    {
      query: (input) => input.routingInstructions.next_inputs.query
    },
    {
      text: PromptTemplate.fromTemplate(CHAT_IDENTITY_CHAIN_PROMPT_TEMPLATE, {
        partialVariables: {
          history: (await history.getMessages())
            .map(
              (message) =>
                `<message>\n<sender>${message.name}</sender><text>${message.content}</text>\n</message>`
            )
            .join('\n')
        }
      })
        .pipe(
          getLargeContextModel({
            modelId,
            stream: true,
            promptSuffix: '<answer>',
            stopSequences: ['</answer>']
          })
        )
        .pipe(new StringOutputParser())
    }
  ]).withConfig({
    callbacks
  });

  const chatHistoryChain = RunnableSequence.from([
    {
      query: (input) => input.routingInstructions.next_inputs.query
    },
    {
      text: PromptTemplate.fromTemplate(CHAT_HISTORY_CHAIN_PROMPT_TEMPLATE, {
        partialVariables: {
          history: (await history.getMessages())
            .map(
              (message) =>
                `<message>\n<sender>${message.name}</sender><text>${message.content}</text>\n</message>`
            )
            .join('\n')
        }
      })
        .pipe(
          getLargeContextModel({
            modelId,
            stream: true,
            promptSuffix: '<answer>',
            stopSequences: ['</answer>']
          })
        )
        .pipe(new StringOutputParser())
    }
  ]).withConfig({
    callbacks
  });

  const faithQaChain = await getDocumentQaChain({
    modelId,
    prompt: CHAT_FAITH_QA_CHAIN_PROMPT_TEMPLATE,
    filters: [
      {
        category: 'bible',
        translation: user.translation
      },
      "metadata->>'category' != 'bible'"
    ],
    history: (await history.getMessages())
      .map((m) => `<message>\n<sender>${m.name}</sender><text>${m.content}</text>\n</message>`)
      .join('\n'),
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
    getLargeContextModel({
      promptSuffix: '<output>',
      stopSequences: ['</output>'],
      temperature: 0.1,
      topK: 5,
      topP: 0.1,
      cache: llmCache
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
  const routerChain = RunnableSequence.from([
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
        history: (await history.getMessages())
          .map((m) => `<message>\n<sender>${m.name}</sender><text>${m.content}</text>\n</message>`)
          .join('\n')
      }
    }),
    getLargeContextModel({
      maxTokens: 4096,
      promptSuffix: '<output>',
      stopSequences: ['</output>'],
      cache: llmCache
    }),
    routerChainOutputParser
  ]);

  const multiRouteChain = RunnableSequence.from([
    {
      routingInstructions: routerChain,
      input: (input) => input.query
    },
    branch
  ]);

  return multiRouteChain;
};

export async function getDocumentQaChain(options: {
  modelId: AnthropicModelId;
  prompt: string;
  callbacks: CallbackManager;
  filters?: (Metadata | string)[];
  history: string;
  extraPromptVars?: PartialValues<string>;
}) {
  const { prompt, filters, extraPromptVars } = options;
  const qaRetriever = await getDocumentVectorStore({
    filters,
    verbose: envConfig.isLocal
  }).then((store) =>
    store.asRetriever({
      k: 12,
      verbose: envConfig.isLocal
    })
  );

  const numSearchQueries = 3;
  const searchQueryOutputParser = OutputFixingParser.fromLLM(
    getLargeContextModel({
      promptSuffix: '<output>',
      stopSequences: ['</output>'],
      temperature: 0.1,
      topK: 5,
      topP: 0.1,
      cache: llmCache
    }),
    JsonMarkdownStructuredOutputParser.fromZodSchema(
      z
        .array(z.string().describe('A search query.'))
        .length(numSearchQueries)
        .describe('The search queries to be used.')
    ),
    {
      prompt: PromptTemplate.fromTemplate(OUTPUT_FIXER_PROMPT_TEMPLATE)
    }
  );

  const qaChain = RunnableSequence.from([
    {
      query: (input) => input.routingInstructions.next_inputs.query
    },
    {
      searchQueries: PromptTemplate.fromTemplate(CHAT_SEARCH_QUERY_CHAIN_PROMPT_TEMPLATE, {
        partialVariables: {
          numSearchQueries: numSearchQueries.toString(),
          history: options.history,
          formatInstructions: searchQueryOutputParser.getFormatInstructions()
        }
      })
        .pipe(
          getLargeContextModel({
            promptSuffix: '<output>',
            stopSequences: ['</output>'],
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
        // remove duplicates from flattened list using document id
        return sourceDocuments
          .flat()
          .filter((doc, index, self) => index === self.findIndex((d) => d.id === doc.id));
      },
      searchQueries: (previousStepResult) => previousStepResult.searchQueries,
      query: (previousStepResult) => previousStepResult.query
    },
    {
      documents: (previousStepResult) =>
        previousStepResult.sourceDocuments
          ?.map(
            (sourceDoc: Document) =>
              `<document>\n<document_content>${sourceDoc.pageContent}</document_content>\n<document_url>${sourceDoc.metadata.url}</document_url>\n</document>`
          )
          .join('\n'),
      sourceDocuments: (previousStepResult) => previousStepResult.sourceDocuments,
      searchQueries: (previousStepResult) => previousStepResult.searchQueries,
      query: (previousStepResult) => previousStepResult.query
    },
    {
      text: PromptTemplate.fromTemplate(prompt, {
        partialVariables: {
          history: options.history,
          ...extraPromptVars
        }
      })
        .pipe(
          getLargeContextModel({
            stream: true,
            promptSuffix: '<answer>',
            stopSequences: ['</answer>']
          })
        )
        .pipe(new StringOutputParser())
        .withConfig({
          callbacks: options.callbacks
        }),
      sourceDocuments: (previousStepResult) => previousStepResult.sourceDocuments,
      searchQueries: (previousStepResult) => previousStepResult.searchQueries
    }
  ]);

  return qaChain;
}
