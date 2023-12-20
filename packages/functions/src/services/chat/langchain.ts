import envConfig from '@core/configs/env';
import type { NeonVectorStoreDocument } from '@core/langchain/vectorstores/neon';
import type { User } from '@core/model/user';
import type { Metadata } from '@core/types/metadata';
import type { CallbackManager } from 'langchain/callbacks';
import type { Document } from 'langchain/document';
import { ChatMessageHistory } from 'langchain/memory';
import { RouterOutputParser } from 'langchain/output_parsers';
import { PromptTemplate } from 'langchain/prompts';
import { AIMessage, HumanMessage, type PartialValues } from 'langchain/schema';
import { StringOutputParser } from 'langchain/schema/output_parser';
import { Runnable, RunnableBranch, RunnableSequence } from 'langchain/schema/runnable';
import { z } from 'zod';
import { getLargeContextModel, llmCache } from '../llm';
import { getDocumentVectorStore } from '../vector-db';
import type { RAIChatMessage } from './chat';
import {
  CHAT_FAITH_QA_CHAIN_PROMPT_TEMPLATE,
  CHAT_HISTORY_CHAIN_PROMPT_TEMPLATE,
  CHAT_IDENTITY_CHAIN_PROMPT_TEMPLATE,
  CHAT_ROUTER_CHAIN_PROMPT_TEMPLATE
} from './prompts';

export const getRAIChatChain = async (options: {
  user: User;
  messages: RAIChatMessage[];
  callbacks: CallbackManager;
}): Promise<
  Runnable<
    { query: string },
    {
      text: string;
      sourceDocuments?: NeonVectorStoreDocument[];
    }
  >
> => {
  const history = new ChatMessageHistory(
    options.messages.slice(-21, -1).map((message) => {
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
            stream: true,
            promptSuffix: '<answer>',
            stopSequences: ['</answer>']
          })
        )
        .pipe(new StringOutputParser())
    }
  ]).withConfig({
    callbacks: options.callbacks
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
            stream: true,
            promptSuffix: '<answer>',
            stopSequences: ['</answer>']
          })
        )
        .pipe(new StringOutputParser())
    }
  ]).withConfig({
    callbacks: options.callbacks
  });

  const faithQaChain = await getDocumentQaChain({
    prompt: CHAT_FAITH_QA_CHAIN_PROMPT_TEMPLATE,
    filters: [
      {
        category: 'bible',
        translation: options.user.translation
      },
      "metadata->>'category' != 'bible'"
    ],
    extraPromptVars: {
      history: (await history.getMessages())
        .map((m) => `<message>\n<sender>${m.name}</sender><text>${m.content}</text>\n</message>`)
        .join('\n')
    },
    callbacks: options.callbacks
  });

  const branch = RunnableBranch.from([
    [(x) => x.routingInstructions.destination === 'identity', identityChain],
    [(x) => x.routingInstructions.destination === 'chat-history', chatHistoryChain],
    [(x) => x.routingInstructions.destination === 'faith-qa', faithQaChain],
    faithQaChain
  ]);

  const routerChainOutputParser = RouterOutputParser.fromZodSchema(
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
  prompt: string;
  filters?: (Metadata | string)[];
  extraPromptVars?: PartialValues<string>;
  callbacks: CallbackManager;
}) {
  const { prompt, filters, extraPromptVars } = options;
  const qaRetriever = await getDocumentVectorStore({
    filters,
    verbose: envConfig.isLocal
  }).then((store) =>
    store.asRetriever({
      k: 20,
      verbose: envConfig.isLocal
    })
  );
  const qaChain = RunnableSequence.from([
    {
      query: (input) => input.routingInstructions.next_inputs.query
    },
    {
      sourceDocuments: RunnableSequence.from([(input) => input.query, qaRetriever]),
      query: (previousStepResult) => previousStepResult.query
    },
    {
      sourceDocuments: (previousStepResult) => previousStepResult.sourceDocuments,
      query: (previousStepResult) => previousStepResult.query,
      documents: (previousStepResult) =>
        previousStepResult.sourceDocuments
          ?.map((sourceDoc: Document) => `<document>\n${sourceDoc.pageContent}\n</document>`)
          .join('\n')
    },
    {
      text: PromptTemplate.fromTemplate(prompt, {
        partialVariables: extraPromptVars
      })
        .pipe(
          getLargeContextModel({
            stream: true,
            promptSuffix: '<answer>',
            stopSequences: ['</answer>']
          })
        )
        .pipe(new StringOutputParser()),
      sourceDocuments: (previousStepResult) => previousStepResult.sourceDocuments
    }
  ]).withConfig({
    callbacks: options.callbacks
  });

  return qaChain;
}
