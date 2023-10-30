import { envConfig } from "@core/configs";
import { RAIChatMultiRouteChain } from "@core/langchain/chains/router/rai-chat-multi-route";
import { RAIBedrock } from "@core/langchain/llms/bedrock";
import { QueryInterpreterRetriever } from "@core/langchain/retrievers/query-interpreter";
import { RAITimeWeightedVectorStoreRetriever } from "@core/langchain/retrievers/time_weighted";
import type {
  AnthropicModelId,
  CohereModelId,
} from "@core/langchain/types/bedrock-types";
import {
  CHAT_FAITH_QA_CHAIN_PROMPT_TEMPLATE,
  CHAT_HISTORY_CHAIN_PROMPT_TEMPLATE,
  CHAT_IDENTITY_CHAIN_PROMPT_TEMPLATE,
  QUERY_INTERPRETER_PROMPT_TEMPLATE,
} from "@lib/prompts";
import type { Message } from "ai";
import { LLMChain, RetrievalQAChain } from "langchain/chains";
import { BedrockEmbeddings } from "langchain/embeddings/bedrock";
import {
  ChatMessageHistory,
  VectorStoreRetrieverMemory,
} from "langchain/memory";
import { PromptTemplate } from "langchain/prompts";
import { AIMessage, HumanMessage } from "langchain/schema";
import { getChatMemoryVectorStore, getDocumentVectorStore } from "./vector-db";

export type StandardModelInput = {
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
  promptPrefix?: string;
  promptSuffix?: string;
};

export const getEmbeddingsModel = () =>
  new BedrockEmbeddings({
    model: "amazon.titan-embed-text-v1",
  });

export const getSmallContextModel = ({
  modelId = "cohere.command-text-v14",
  temperature = 2,
  maxTokens = 2048,
  stopSequences = [],
  stream = false,
  topK = 100,
  topP = 0.25,
  promptPrefix,
  promptSuffix,
}: StandardModelInput & { modelId?: CohereModelId } = {}) =>
  new RAIBedrock({
    modelId: modelId,
    stream: stream,
    body: {
      max_tokens: maxTokens,
      temperature: temperature,
      p: topP,
      k: topK,
      stop_sequences: stopSequences,
      return_likelihoods: "NONE",
    },
    promptPrefix,
    promptSuffix,
    verbose: envConfig.isLocal,
  });

export const getLargeContextModel = ({
  modelId = "anthropic.claude-instant-v1",
  temperature = 0.7,
  maxTokens = 2048,
  stopSequences = [],
  stream = false,
  topK = 250,
  topP = 0.75,
  promptPrefix,
  promptSuffix,
}: StandardModelInput & { modelId?: AnthropicModelId } = {}) =>
  new RAIBedrock({
    modelId: modelId,
    stream: stream,
    body: {
      max_tokens_to_sample: maxTokens,
      temperature: temperature,
      top_p: topP,
      top_k: topK,
      stop_sequences: stopSequences,
    },
    promptPrefix,
    promptSuffix,
    verbose: envConfig.isLocal,
  });

export const getRAIChatChain = async (chatId: string, messages: Message[]) => {
  const history = new ChatMessageHistory(
    messages.slice(0, -1).map((message) => {
      return message.role === "user"
        ? new HumanMessage(message.content)
        : new AIMessage(message.content);
    })
  );

  const identityChain = new LLMChain({
    llm: getLargeContextModel({
      stream: true,
      promptSuffix: "<answer>",
      stopSequences: ["</answer>"],
    }),
    prompt: PromptTemplate.fromTemplate(CHAT_IDENTITY_CHAIN_PROMPT_TEMPLATE),
    outputKey: "text",
    verbose: envConfig.isLocal,
  });

  const chatMemoryRetriever = await getChatMemoryVectorStore(chatId, {
    verbose: envConfig.isLocal,
  }).then(async (store) => {
    return new RAITimeWeightedVectorStoreRetriever({
      vectorStore: store,
      k: 100,
      verbose: envConfig.isLocal,
    });
  });
  const chatHistoryChain = RetrievalQAChain.fromLLM(
    getLargeContextModel({
      stream: true,
      promptSuffix: "<answer>",
      stopSequences: ["</answer>"],
    }),
    chatMemoryRetriever,
    {
      prompt: PromptTemplate.fromTemplate(CHAT_HISTORY_CHAIN_PROMPT_TEMPLATE),
      inputKey: "query",
      verbose: envConfig.isLocal,
    }
  );

  const documentVectorStore = await getDocumentVectorStore({ verbose: true });
  const faithQaChain = RetrievalQAChain.fromLLM(
    getLargeContextModel({
      stream: true,
      promptSuffix: "<answer>",
      stopSequences: ["</answer>"],
    }),
    new QueryInterpreterRetriever({
      llm: getLargeContextModel({
        stream: false,
        promptSuffix: "<output>",
        stopSequences: ["</output>"],
      }),
      baseRetriever: documentVectorStore.asRetriever({
        k: 7,
        verbose: envConfig.isLocal,
      }),
      numSearchTerms: 3,
      prompt: PromptTemplate.fromTemplate(QUERY_INTERPRETER_PROMPT_TEMPLATE),
      verbose: envConfig.isLocal,
    }),
    {
      prompt: PromptTemplate.fromTemplate(CHAT_FAITH_QA_CHAIN_PROMPT_TEMPLATE),
      inputKey: "query",
      returnSourceDocuments: true,
      verbose: envConfig.isLocal,
    }
  );

  const multiRouteChain = await RAIChatMultiRouteChain.fromLLMAndChains(
    getLargeContextModel({
      maxTokens: 4096,
      promptSuffix: "<output>",
      stopSequences: ["</output>"],
    }),
    {
      routerChainOpts: {
        history,
        verbose: envConfig.isLocal,
      },
      multiRouteChainOpts: {
        memory: new VectorStoreRetrieverMemory({
          vectorStoreRetriever: chatMemoryRetriever,
          inputKey: "input",
          outputKey: "text",
          memoryKey: "chat_history",
          returnDocs: true,
        }),
        verbose: envConfig.isLocal,
      },
      destinationChainsInfo: {
        identity: {
          description:
            "Good for introducing yourself or talking about yourself.",
          chain: identityChain,
        },
        "chat-history": {
          description:
            "Good for retrieving information about the current chat conversation.",
          chain: chatHistoryChain,
        },
        "faith-qa": {
          description:
            "Good for answering questions or generating content about the Christian faith and theology.",
          chain: faithQaChain,
        },
      },
      defaultChain: "faith-qa",
    }
  );

  return multiRouteChain;
};
