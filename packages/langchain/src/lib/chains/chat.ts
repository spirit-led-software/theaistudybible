import type { JwtPayload } from '@clerk/types';
import type { CallbackManager } from '@langchain/core/callbacks/manager';
import type { MessageContent, MessageType } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { BasePromptTemplate } from '@langchain/core/prompts';
import { Runnable, RunnableBranch, RunnableSequence } from '@langchain/core/runnables';
import type { Message } from '@theaistudybible/core/model/chat/message';
import {
  allModels,
  type FreeTierModelId,
  type PlusTierModelId
} from '@theaistudybible/core/model/llm';
import { RAIOutputFixingParser } from '@theaistudybible/langchain/output_parsers/rai-output-fixing';
import type { UpstashVectorStoreDocument } from '@theaistudybible/langchain/vectorstores/upstash';
import { XMLBuilder } from 'fast-xml-parser';
import { CustomListOutputParser, RouterOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';
import { llmCache } from '../cache';
import { getLanguageModel } from '../llm';
import {
  getFaithQaChainPromptInfo,
  getHistoryChainPromptInfo,
  getIdentityChainPromptInfo,
  getRouterChainPromptInfo,
  getSearchQueryChainPromptInfo
} from '../prompts/chat';
import { getDocumentVectorStore } from '../vector-db';

const queryAnsweringSystems = [
  'identity: For greetings, introducing yourself, or talking about yourself.',
  'chat-history: For retrieving information about the current chat conversation.',
  'faith-qa: For answering general queries about Christian faith.'
];

const routerChainOutputParser = RAIOutputFixingParser.fromParser(
  RouterOutputParser.fromZodSchema(
    z.object({
      destination: z
        .string()
        .optional()
        .describe(
          'The name of the question answering system to use. This can just be "DEFAULT" without the quotes if you do not know which system is best.'
        )
        .default('DEFAULT'),
      next_inputs: z
        .object({
          query: z.string().describe('The query to be fed into the next model.').min(1)
        })
        .describe('The input to be fed into the next model.')
        .required()
    })
  )
);

export const getRAIChatChain = async (options: {
  modelId: FreeTierModelId | PlusTierModelId;
  claims: JwtPayload;
  messages: Message[];
  callbacks: CallbackManager;
}): Promise<
  Runnable<
    { query: string },
    {
      text: string;
      sourceDocuments?: UpstashVectorStoreDocument[];
      searchQueries?: string[];
    }
  >
> => {
  const { modelId, claims, callbacks } = options;

  const { contextSize } = allModels[modelId];
  const contextSizeNum = parseInt(contextSize.substring(0, contextSize.indexOf('k')));

  let messages = options.messages.slice(contextSizeNum > 32 ? -21 : -11);
  if (messages.at(-1)?.role === 'user') {
    messages = messages.slice(0, -1);
  }

  const history = messages.map((message) => {
    return [message.role, message.content] as [MessageType, MessageContent];
  });

  const { prompt: identityChainPrompt, stopSequences: identityChainStopSequences } =
    getIdentityChainPromptInfo({ history });
  const identityChain = RunnableSequence.from([
    {
      query: (input) => input.routingInstructions.next_inputs.query
    },
    {
      text: identityChainPrompt
        .pipe(
          getLanguageModel({
            modelId,
            stream: true,
            stopSequences: identityChainStopSequences
          })
        )
        .pipe(new StringOutputParser())
        .withConfig({
          callbacks
        })
    }
  ]);

  const { prompt: historyChainPrompt, stopSequences: historyChainStopSequences } =
    getHistoryChainPromptInfo({ history });
  const chatHistoryChain = RunnableSequence.from([
    {
      query: (input) => input.routingInstructions.next_inputs.query
    },
    {
      text: historyChainPrompt
        .pipe(
          getLanguageModel({
            modelId,
            stream: true,
            stopSequences: historyChainStopSequences
          })
        )
        .pipe(new StringOutputParser())
        .withConfig({
          callbacks
        })
    }
  ]);

  const { prompt: faithQaChainPrompt, stopSequences: faithQaChainStopSequences } =
    await getFaithQaChainPromptInfo({
      history,
      bibleTranslation: claims.metadata.bibleTranslation ?? 'WEB'
    });
  const faithQaChain = await getDocumentQaChain({
    modelId,
    contextSize: contextSizeNum,
    prompt: faithQaChainPrompt,
    stopSequences: faithQaChainStopSequences,
    filter: `(category = 'bible' AND translation = '${claims.metadata.bibleTranslation ?? 'WEB'}') OR category != 'bible'`,
    history,
    callbacks
  });

  const branch = RunnableBranch.from([
    [(x) => x.routingInstructions.destination === 'identity', identityChain],
    [(x) => x.routingInstructions.destination === 'chat-history', chatHistoryChain],
    [(x) => x.routingInstructions.destination === 'faith-qa', faithQaChain],
    faithQaChain
  ]);

  const { prompt: routerPrompt, stopSequences: routerStopSequences } =
    await getRouterChainPromptInfo({
      history,
      candidates: queryAnsweringSystems,
      formatInstructions: routerChainOutputParser.getFormatInstructions()
    });
  const multiRouteChain = RunnableSequence.from([
    {
      routingInstructions: RunnableSequence.from([
        routerPrompt,
        getLanguageModel({
          cache: llmCache,
          stopSequences: routerStopSequences
        }),
        routerChainOutputParser
      ]),
      input: (input) => input.query
    },
    branch
  ]);

  return multiRouteChain;
};

const searchQueryOutputParser = RAIOutputFixingParser.fromParser(
  new CustomListOutputParser({ separator: '\n' })
);

export async function getDocumentQaChain(options: {
  modelId: FreeTierModelId | PlusTierModelId;
  contextSize: number;
  prompt: BasePromptTemplate;
  stopSequences?: string[];
  callbacks: CallbackManager;
  filter?: string;
  history: [MessageType, MessageContent][];
}) {
  const { modelId, contextSize, prompt, stopSequences, filter, history, callbacks } = options;
  const qaRetriever = await getDocumentVectorStore({
    filter,
    verbose: process.env.IS_LOCAL === 'true'
  }).then((store) =>
    store.asRetriever({
      k: contextSize > 32 ? 12 : 5,
      verbose: process.env.IS_LOCAL === 'true'
    })
  );

  const { prompt: searchQueryPrompt, stopSequences: searchQueryStopSequences } =
    await getSearchQueryChainPromptInfo({
      history,
      formatInstructions: searchQueryOutputParser.getFormatInstructions()
    });
  const qaChain = RunnableSequence.from([
    {
      query: (input) => input.routingInstructions.next_inputs.query
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
      query: (previousStepResult) => previousStepResult.query
    },
    {
      sourceDocuments: async (previousStepResult: { searchQueries: string[] }) => {
        const searchQueries = previousStepResult.searchQueries;
        const sourceDocuments = await Promise.all(
          searchQueries.map(async (query) => {
            return (await qaRetriever.getRelevantDocuments(query)) as UpstashVectorStoreDocument[];
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
      query: (previousStepResult) => previousStepResult.query
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
      text: prompt
        .pipe(
          getLanguageModel({
            modelId,
            stream: true,
            stopSequences
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
