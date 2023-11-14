import { envConfig } from "@core/configs";
import { RAITimeWeightedVectorStoreRetriever } from "@core/langchain/retrievers/time_weighted";
import type { NeonVectorStoreDocument } from "@core/langchain/vectorstores";
import {
  CHAT_FAITH_QA_CHAIN_PROMPT_TEMPLATE,
  CHAT_HISTORY_CHAIN_PROMPT_TEMPLATE,
  CHAT_IDENTITY_CHAIN_PROMPT_TEMPLATE,
  CHAT_QUERY_INTERPRETER_PROMPT_TEMPLATE,
  CHAT_ROUTER_CHAIN_PROMPT_TEMPLATE,
} from "@services/chat/prompts";
import type { Message } from "ai";
import type { Document } from "langchain/document";
import {
  ChatMessageHistory,
  VectorStoreRetrieverMemory,
} from "langchain/memory";
import {
  RouterOutputParser,
  StructuredOutputParser,
} from "langchain/output_parsers";
import { PromptTemplate } from "langchain/prompts";
import { AIMessage, HumanMessage } from "langchain/schema";
import { StringOutputParser } from "langchain/schema/output_parser";
import {
  Runnable,
  RunnableBranch,
  RunnableSequence,
} from "langchain/schema/runnable";
import { z } from "zod";
import { getLargeContextModel, llmCache } from "../llm";
import { getChatMemoryVectorStore, getDocumentVectorStore } from "../vector-db";

export const getRAIChatChain = async (
  chatId: string,
  messages: Message[]
): Promise<{
  chain: Runnable<
    { query: string },
    {
      text: string;
      sourceDocuments?: NeonVectorStoreDocument[];
    }
  >;
  memory: VectorStoreRetrieverMemory;
}> => {
  const history = new ChatMessageHistory(
    messages.slice(0, -1).map((message) => {
      return message.role === "user"
        ? new HumanMessage(message.content)
        : new AIMessage(message.content);
    })
  );

  const identityChain = RunnableSequence.from([
    {
      query: (input) => input.routingInstructions.next_inputs.query,
    },
    {
      text: PromptTemplate.fromTemplate(CHAT_IDENTITY_CHAIN_PROMPT_TEMPLATE)
        .pipe(
          getLargeContextModel({
            stream: true,
            promptSuffix: "<answer>",
            stopSequences: ["</answer>"],
          })
        )
        .pipe(new StringOutputParser()),
    },
  ]);

  const chatMemoryRetriever = await getChatMemoryVectorStore(chatId, {
    verbose: envConfig.isLocal,
  }).then(async (store) => {
    return new RAITimeWeightedVectorStoreRetriever({
      vectorStore: store,
      k: 100,
      verbose: envConfig.isLocal,
    });
  });
  const chatHistoryChain = RunnableSequence.from([
    {
      sourceDocuments: RunnableSequence.from([
        (input) => input.routingInstructions.next_inputs.query,
        chatMemoryRetriever,
      ]),
      query: (input) => input.routingInstructions.next_inputs.query,
    },
    {
      query: (previousStepResult) => previousStepResult.query,
      history: (previousStepResult) =>
        previousStepResult.sourceDocuments
          ?.map(
            (sourceDoc: Document) =>
              `<message>\n${sourceDoc.pageContent}\n</message>`
          )
          .join("\n"),
    },
    {
      text: PromptTemplate.fromTemplate(CHAT_HISTORY_CHAIN_PROMPT_TEMPLATE)
        .pipe(
          getLargeContextModel({
            stream: true,
            promptSuffix: "<answer>",
            stopSequences: ["</answer>"],
          })
        )
        .pipe(new StringOutputParser()),
    },
  ]);

  const numSearchTerms = 3;
  const queryInterpreterOutputParser = StructuredOutputParser.fromZodSchema(
    z
      .array(z.string())
      .length(numSearchTerms)
      .describe(
        "Search terms or phrases that you would use to find relevant documents."
      )
  );
  const faithQaRetriever = await getDocumentVectorStore({
    verbose: envConfig.isLocal,
  }).then((store) => store.asRetriever({ k: 7, verbose: envConfig.isLocal }));
  const faithQaChain = RunnableSequence.from([
    {
      query: (input) => input.routingInstructions.next_inputs.query,
    },
    {
      generatedSearchQueries: PromptTemplate.fromTemplate(
        CHAT_QUERY_INTERPRETER_PROMPT_TEMPLATE,
        {
          partialVariables: {
            numSearchTerms: numSearchTerms.toString(),
            formatInstructions:
              queryInterpreterOutputParser.getFormatInstructions(),
          },
        }
      )
        .pipe(
          getLargeContextModel({
            stream: false,
            promptSuffix: "<output>",
            stopSequences: ["</output>"],
            cache: llmCache,
          })
        )
        .pipe(queryInterpreterOutputParser),
      query: (previousStepResult) => previousStepResult.query,
    },
    {
      sourceDocuments: async (previousStepResult): Promise<Document[]> => {
        const sourceDocs = await Promise.all(
          previousStepResult.generatedSearchQueries.map(async (q: string) => {
            return await faithQaRetriever.getRelevantDocuments(q);
          })
        );
        return sourceDocs.flat();
      },
      query: (previousStepResult) => previousStepResult.query,
    },
    {
      sourceDocuments: (previousStepResult) =>
        previousStepResult.sourceDocuments,
      query: (previousStepResult) => previousStepResult.query,
      documents: (previousStepResult) =>
        previousStepResult.sourceDocuments
          ?.map(
            (sourceDoc: Document) =>
              `<document>\n${sourceDoc.pageContent}\n</document>`
          )
          .join("\n"),
    },
    {
      text: PromptTemplate.fromTemplate(CHAT_FAITH_QA_CHAIN_PROMPT_TEMPLATE)
        .pipe(
          getLargeContextModel({
            stream: true,
            promptSuffix: "<answer>",
            stopSequences: ["</answer>"],
          })
        )
        .pipe(new StringOutputParser()),
      sourceDocuments: (previousStepResult) =>
        previousStepResult.sourceDocuments,
    },
  ]);

  const branch = RunnableBranch.from([
    [(x) => x.routingInstructions.destination === "identity", identityChain],
    [
      (x) => x.routingInstructions.destination === "chat-history",
      chatHistoryChain,
    ],
    [(x) => x.routingInstructions.destination === "faith-qa", faithQaChain],
    faithQaChain,
  ]);

  const routerChainOutputParser = new RouterOutputParser(
    z.object({
      destination: z
        .string()
        .optional()
        .describe(
          'The name of the question answering system to use. This can just be "DEFAULT" without the quotes if you do not know which system is best.'
        ),
      next_inputs: z
        .object({
          query: z
            .string()
            .describe("The query to be fed into the next model."),
        })
        .describe("The input to be fed into the next model."),
    })
  );
  const routerChain = RunnableSequence.from([
    new PromptTemplate({
      template: CHAT_ROUTER_CHAIN_PROMPT_TEMPLATE,
      inputVariables: ["query"],
      partialVariables: {
        formatInstructions: routerChainOutputParser.getFormatInstructions(),
        destinations: `identity: Good for introducing yourself or talking about yourself.\nchat-history: Good for retrieving information about the current chat conversation.\nfaith-qa: Good for answering questions or generating content about the Christian faith and theology.`,
        history: (await history.getMessages())
          .map(
            (m) =>
              `<message>\n<sender>${m.name}</sender><text>${m.content}</text>\n</message>`
          )
          .join("\n"),
      },
    }),
    getLargeContextModel({
      maxTokens: 4096,
      promptSuffix: "<output>",
      stopSequences: ["</output>"],
      cache: llmCache,
    }),
    routerChainOutputParser,
  ]);

  const multiRouteChain = RunnableSequence.from([
    {
      routingInstructions: routerChain,
      input: (input) => input.query,
    },
    branch,
  ]);

  return {
    chain: multiRouteChain,
    memory: new VectorStoreRetrieverMemory({
      vectorStoreRetriever: chatMemoryRetriever,
      inputKey: "input",
      outputKey: "output",
    }),
  };
};
