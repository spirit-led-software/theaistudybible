import { llmConfig, openAiConfig } from "@core/configs";
import { RAIChatMultiRouteChain } from "@core/langchain/chains/router/rai-chat-multi-route";
import { NeonDocLLMChainExtractor } from "@core/langchain/retrievers/document_compressors/chain_extract";
import { Chat } from "@core/model";
import { Message } from "ai";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import {
  BufferMemory,
  ChatMessageHistory,
  VectorStoreRetrieverMemory,
} from "langchain/memory";
import { ContextualCompressionRetriever } from "langchain/retrievers/contextual_compression";
import { AIMessage, BaseMessage, HumanMessage } from "langchain/schema";
import { OpenAI as OpenAIClient } from "openai";
import { RAITimeWeightedVectorStoreRetriever } from "../../../core/src/langchain/retrievers/time_weighted";
import { getChatMemoryVectorStore, getDocumentVectorStore } from "./vector-db";

export const getEmbeddingsModel = () =>
  new OpenAIEmbeddings({
    openAIApiKey: openAiConfig.apiKey,
    modelName: llmConfig.embeddingsModelName,
  });

export const getChatModel = (temperature?: number) =>
  new ChatOpenAI({
    openAIApiKey: openAiConfig.apiKey,
    temperature: temperature ?? 1.0,
    modelName: llmConfig.chatModelName,
    streaming: true,
    maxTokens: -1,
  });

export const getAgentModel = (temperature?: number) =>
  new ChatOpenAI({
    openAIApiKey: openAiConfig.apiKey,
    temperature: temperature ?? 1.0,
    modelName: llmConfig.chatModelName,
    streaming: true,
    callbacks: [{}],
    maxTokens: -1,
  });

export const getPromptModel = (temperature?: number) =>
  new OpenAI({
    openAIApiKey: openAiConfig.apiKey,
    temperature: temperature ?? 0.3,
    modelName: llmConfig.promptModelName,
    maxTokens: -1,
    cache: true,
  });

export const getCompletionsModel = (temperature?: number) =>
  new OpenAI({
    openAIApiKey: openAiConfig.apiKey,
    temperature: temperature ?? 0.7,
    modelName: llmConfig.completionsModelName,
    maxTokens: -1,
    cache: true,
  });

export const getOpenAiClient = () =>
  new OpenAIClient({
    apiKey: openAiConfig.apiKey,
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

  const chatMemoryVectorStore = await getChatMemoryVectorStore(chat.id, {
    verbose: true,
  });
  await chatMemoryVectorStore.ensureTableInDatabase();
  const chatMemoryRetriever = new RAITimeWeightedVectorStoreRetriever({
    vectorStore: chatMemoryVectorStore,
    k: 10,
    searchKwargs: {
      fetchK: 100,
    },
    verbose: true,
  });

  const chatMemoryRetrieverChain = ConversationalRetrievalQAChain.fromLLM(
    getChatModel(),
    chatMemoryRetriever,
    {
      questionGeneratorChainOptions: {
        llm: getPromptModel(),
      },
      inputKey: "query",
      outputKey: "text",
      memory: retrievalChainMemory,
      verbose: true,
    }
  );

  const documentVectorStore = await getDocumentVectorStore({ verbose: true });
  const documentRetriever = new ContextualCompressionRetriever({
    baseCompressor: NeonDocLLMChainExtractor.fromLLM(getPromptModel(0.5)),
    baseRetriever: documentVectorStore.asRetriever({
      k: 6,
      verbose: true,
    }),
    verbose: true,
  });
  const documentRetrieverChain = ConversationalRetrievalQAChain.fromLLM(
    getChatModel(),
    documentRetriever,
    {
      questionGeneratorChainOptions: {
        llm: getPromptModel(),
      },
      inputKey: "query",
      outputKey: "text",
      memory: retrievalChainMemory,
      returnSourceDocuments: true,
      verbose: true,
    }
  );

  const multiRouteChain = await RAIChatMultiRouteChain.fromLLMAndChains(
    getPromptModel(),
    {
      routerChainOpts: {
        verbose: true,
      },
      multiRouteChainOpts: {
        memory: new VectorStoreRetrieverMemory({
          // TODO: Remove this hack
          // @ts-ignore
          vectorStoreRetriever: chatMemoryRetriever,
          inputKey: "input",
          outputKey: "text",
          memoryKey: "chat_history",
          returnDocs: true,
        }),
        verbose: true,
      },
      destinationChainsInfo: {
        "chat-history": {
          description:
            "Good for retrieving information about the current chat conversation",
          chain: chatMemoryRetrieverChain,
        },
        "faith-qa": {
          description:
            "Good for answering questions about the Christian faith and theology",
          chain: documentRetrieverChain,
        },
      },
      defaultChain: "faith-qa",
    }
  );

  return multiRouteChain;
};
