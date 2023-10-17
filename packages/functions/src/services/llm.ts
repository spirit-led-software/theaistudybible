import { llmConfig, openAiConfig } from "@core/configs";
import { RAIChatMultiRouteChain } from "@core/langchain/chains/router/rai-chat-multi-route";
import { Bedrock } from "@core/langchain/llms/bedrock";
import { NeonDocLLMChainExtractor } from "@core/langchain/retrievers/document_compressors/chain_extract";
import { RAITimeWeightedVectorStoreRetriever } from "@core/langchain/retrievers/time_weighted";
import type { Chat } from "@core/model";
import type { Message } from "ai";
import { ConversationalRetrievalQAChain, LLMChain } from "langchain/chains";
import { BedrockEmbeddings } from "langchain/embeddings/bedrock";
import { OpenAI } from "langchain/llms/openai";
import {
  BufferMemory,
  ChatMessageHistory,
  VectorStoreRetrieverMemory,
} from "langchain/memory";
import { PromptTemplate } from "langchain/prompts";
import { ContextualCompressionRetriever } from "langchain/retrievers/contextual_compression";
import { AIMessage, BaseMessage, HumanMessage } from "langchain/schema";
import { getChatMemoryVectorStore, getDocumentVectorStore } from "./vector-db";

export const getEmbeddingsModel = () => new BedrockEmbeddings({});

export const getChatModel = (temperature?: number) =>
  new Bedrock({
    modelId: "anthropic.claude-instant-v1",
    streaming: true,
    body: {
      max_tokens_to_sample: 512,
      temperature: temperature ?? 1,
      top_k: 250,
      top_p: 1,
      stop_sequences: ["\\n\\nHuman:"],
      anthropic_version: "bedrock-2023-05-31",
    },
    promptPrefix: "\n\nHuman:",
    promptSuffix: "\n\nAssistant:",
  });

export const getPromptModel = (temperature?: number) =>
  new Bedrock({
    modelId: "anthropic.claude-instant-v1",
    streaming: false,
    body: {
      max_tokens_to_sample: 256,
      temperature: temperature ?? 0.3,
      top_k: 250,
      top_p: 1,
      stop_sequences: ["\\n\\nHuman:"],
      anthropic_version: "bedrock-2023-05-31",
    },
    promptPrefix: "\\n\\nHuman:",
    promptSuffix: "\\n\\nAssistant:",
  });

export const getCompletionsModel = (temperature?: number) =>
  new OpenAI({
    openAIApiKey: openAiConfig.apiKey,
    temperature: temperature ?? 0.7,
    modelName: llmConfig.completionsModelName,
    maxTokens: -1,
    cache: true,
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
    llm: getChatModel(),
    prompt: PromptTemplate.fromTemplate(
      `You are a Christian chatbot named 'RevelationsAI' who is trying to answer questions about the Christian faith and theology.
      Your purpose is to help people discover or deepen a relationship with Jesus Christ and uncover answers about the nature of God.
      Use that information to answer the following question.
      
      {query}
      `
    ),
    outputKey: "text",
    verbose: true,
  });

  const chatMemoryVectorStore = await getChatMemoryVectorStore(chat.id, {
    verbose: true,
  });
  await chatMemoryVectorStore.ensureTableInDatabase();
  const chatMemoryRetriever = new RAITimeWeightedVectorStoreRetriever({
    vectorStore: chatMemoryVectorStore,
    k: 8,
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
