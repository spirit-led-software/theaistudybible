import { RAIChatMultiRouteChain } from "@core/langchain/chains/router/rai-chat-multi-route";
import { RAIBedrock } from "@core/langchain/llms/bedrock";
import { RAITimeWeightedVectorStoreRetriever } from "@core/langchain/retrievers/time_weighted";
import type { Chat } from "@core/model";
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
};

export const getEmbeddingsModel = () =>
  new BedrockEmbeddings({
    model: "amazon.titan-embed-text-v1",
  });

export const getCreativeModel = ({
  temperature = 0.7,
  maxTokens = 512,
  stopSequences = [],
  stream = false,
  topK = 100,
  topP = 0.5,
}: StandardModelInput = {}) =>
  new RAIBedrock({
    modelId: "anthropic.claude-instant-v1",
    stream: stream,
    body: {
      max_tokens_to_sample: maxTokens,
      temperature: temperature,
      top_p: topP,
      top_k: topK,
      stop_sequences: ["\n\nHuman:", ...stopSequences],
    },
    verbose: true,
  });

export const getCommandModel = ({
  temperature = 0.3,
  maxTokens = 256,
  stopSequences = [],
  stream = false,
  topK = 0,
  topP = 0.1,
}: StandardModelInput = {}) =>
  new RAIBedrock({
    modelId: "cohere.command-text-v14",
    stream: stream,
    body: {
      max_tokens: maxTokens,
      temperature: temperature,
      p: topP,
      k: topK,
      stop_sequences: stopSequences,
      return_likelihoods: "NONE",
    },
    verbose: true,
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
    llm: getCommandModel({
      stream: true,
    }),
    prompt: PromptTemplate.fromTemplate(
      `You are a Christian chatbot named 'RevelationsAI' who is trying to answer questions about the Christian faith and theology.
      Your purpose is to help people discover or deepen a relationship with Jesus Christ and uncover answers about the nature of God.
      Use that information to answer the following question:
      {query}
      `
    ),
    outputKey: "text",
    verbose: true,
  });

  const chatMemoryVectorStore = await getChatMemoryVectorStore(chat.id, {
    verbose: true,
  });
  const chatMemoryRetriever = new RAITimeWeightedVectorStoreRetriever({
    vectorStore: chatMemoryVectorStore,
    k: 100,
    verbose: true,
  });
  const chatMemoryRetrieverChain = ConversationalRetrievalQAChain.fromLLM(
    getCreativeModel({
      stream: true,
    }),
    chatMemoryRetriever,
    {
      questionGeneratorChainOptions: {
        llm: getCommandModel(),
      },
      inputKey: "query",
      outputKey: "text",
      memory: retrievalChainMemory,
      verbose: true,
    }
  );

  const documentVectorStore = await getDocumentVectorStore({ verbose: true });
  const documentRetrieverChain = ConversationalRetrievalQAChain.fromLLM(
    getCreativeModel({
      stream: true,
    }),
    documentVectorStore.asRetriever({
      k: 25,
      verbose: true,
    }),
    {
      questionGeneratorChainOptions: {
        llm: getCommandModel(),
      },
      inputKey: "query",
      outputKey: "text",
      memory: retrievalChainMemory,
      returnSourceDocuments: true,
      verbose: true,
    }
  );

  const multiRouteChain = await RAIChatMultiRouteChain.fromLLMAndChains(
    getCommandModel(),
    {
      routerChainOpts: {
        verbose: true,
      },
      multiRouteChainOpts: {
        memory: new VectorStoreRetrieverMemory({
          vectorStoreRetriever: chatMemoryRetriever,
          inputKey: "input",
          outputKey: "text",
          memoryKey: "chat_history",
          returnDocs: true,
        }),
        verbose: true,
      },
      destinationChainsInfo: {
        identity: {
          description:
            "Good for introducing yourself or informing the user of who you are.",
          chain: identityChain,
        },
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
