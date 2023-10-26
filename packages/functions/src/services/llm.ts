import { envConfig } from "@core/configs";
import { RAIChatMultiRouteChain } from "@core/langchain/chains/router/rai-chat-multi-route";
import { RAIBedrock } from "@core/langchain/llms/bedrock";
import { RAITimeWeightedVectorStoreRetriever } from "@core/langchain/retrievers/time_weighted";
import type {
  AnthropicModelId,
  CohereModelId,
} from "@core/langchain/types/bedrock-types";
import type { Chat } from "@core/model";
import {
  CHAT_FAITH_QA_CHAIN_PROMPT_TEMPLATE,
  CHAT_HISTORY_CHAIN_PROMPT_TEMPLATE,
  CHAT_IDENTITY_CHAIN_PROMPT_TEMPLATE,
  CHAT_QUESTION_GENERATOR_CHAIN_PROMPT_TEMPLATE,
} from "@lib/prompts";
import type { Message } from "ai";
import { ConversationalRetrievalQAChain, LLMChain } from "langchain/chains";
import { BedrockEmbeddings } from "langchain/embeddings/bedrock";
import {
  BufferMemory,
  ChatMessageHistory,
  VectorStoreRetrieverMemory,
} from "langchain/memory";
import { PromptTemplate } from "langchain/prompts";
import { AIMessage, BaseMessage, HumanMessage } from "langchain/schema";
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

export const getRAIChatChain = async (chat: Chat, messages: Message[]) => {
  const history: BaseMessage[] = messages.slice(0, -1).map((message) => {
    return message.role === "user"
      ? new HumanMessage(message.content)
      : new AIMessage(message.content);
  });
  const retrievalChainMemory = new BufferMemory({
    chatHistory: new ChatMessageHistory(history),
    inputKey: "query",
    outputKey: "text",
    memoryKey: "chat_history",
    returnMessages: true,
  });

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

  const chatMemoryVectorStore = await getChatMemoryVectorStore(chat.id, {
    verbose: envConfig.isLocal,
  });
  const chatMemoryRetriever = new RAITimeWeightedVectorStoreRetriever({
    vectorStore: chatMemoryVectorStore,
    k: 100,
    verbose: envConfig.isLocal,
  });
  const chatHistoryChain = ConversationalRetrievalQAChain.fromLLM(
    getLargeContextModel({
      stream: true,
      promptSuffix: "<answer>",
      stopSequences: ["</answer>"],
    }),
    chatMemoryRetriever,
    {
      qaChainOptions: {
        type: "stuff",
        prompt: PromptTemplate.fromTemplate(CHAT_HISTORY_CHAIN_PROMPT_TEMPLATE),
      },
      questionGeneratorChainOptions: {
        llm: getLargeContextModel({
          stream: false,
          promptSuffix: "<new_question>",
          stopSequences: ["</new_question>"],
        }),
        template: CHAT_QUESTION_GENERATOR_CHAIN_PROMPT_TEMPLATE,
      },
      inputKey: "query",
      outputKey: "text",
      memory: retrievalChainMemory,
      verbose: envConfig.isLocal,
    }
  );

  const documentVectorStore = await getDocumentVectorStore({ verbose: true });
  const faithQaChain = ConversationalRetrievalQAChain.fromLLM(
    getLargeContextModel({
      stream: true,
      promptSuffix: "<answer>",
      stopSequences: ["</answer>"],
    }),
    // new QueryInterpreterRetriever({
    //   llm: getLargeContextModel({
    //     stream: false,
    //     promptSuffix: "<output>",
    //     stopSequences: ["</output>"],
    //   }),
    //   baseRetriever: documentVectorStore.asRetriever({
    //     k: 5,
    //     verbose: envConfig.isLocal,
    //   }),
    //   numSearchTerms: 7,
    //   prompt: PromptTemplate.fromTemplate(QUERY_INTERPRETER_PROMPT_TEMPLATE),
    //   verbose: envConfig.isLocal,
    // }),
    documentVectorStore.asRetriever({
      k: 25,
      verbose: envConfig.isLocal,
    }),
    {
      qaChainOptions: {
        type: "stuff",
        prompt: PromptTemplate.fromTemplate(
          CHAT_FAITH_QA_CHAIN_PROMPT_TEMPLATE
        ),
      },
      questionGeneratorChainOptions: {
        llm: getLargeContextModel({
          stream: false,
          promptSuffix: "<new_question>",
          stopSequences: ["</new_question>"],
        }),
        template: CHAT_QUESTION_GENERATOR_CHAIN_PROMPT_TEMPLATE,
      },
      inputKey: "query",
      outputKey: "text",
      memory: retrievalChainMemory,
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
      multiRouteChainOpts: {
        memory: new VectorStoreRetrieverMemory({
          vectorStoreRetriever: chatMemoryRetriever,
          inputKey: "input",
          outputKey: "text",
          memoryKey: "chat_history",
          returnDocs: true,
        }),
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
