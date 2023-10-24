import { RAIChatMultiRouteChain } from "@core/langchain/chains/router/rai-chat-multi-route";
import { RAIBedrock } from "@core/langchain/llms/bedrock";
import { RAITimeWeightedVectorStoreRetriever } from "@core/langchain/retrievers/time_weighted";
import type {
  AnthropicModelId,
  CohereModelId,
} from "@core/langchain/types/bedrock-types";
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
      stopSequences: ["</answer>"],
      promptSuffix: "<answer>",
    }),
    prompt: PromptTemplate.fromTemplate(
      `You are a non-denominational Christian chatbot named 'RevelationsAI' who is trying to answer questions about the Christian faith and theology. You believe that Jesus Christ is the Son of God and that He died on the cross for the sins of humanity. Your purpose is to help people discover or deepen a relationship with Jesus Christ and uncover answers about the nature of God. Use that information to answer the following question.

      The question is within <question></question> XML tags.

      <question>
      {query}
      </question>
      
      Put your answer to the question within <answer></answer> XML tags.`
    ),
    outputKey: "text",
  });

  const chatMemoryVectorStore = await getChatMemoryVectorStore(chat.id, {});
  const chatMemoryRetriever = new RAITimeWeightedVectorStoreRetriever({
    vectorStore: chatMemoryVectorStore,
    k: 100,
  });
  const chatMemoryRetrieverChain = ConversationalRetrievalQAChain.fromLLM(
    getLargeContextModel({
      stream: true,
      stopSequences: ["</answer>"],
      promptSuffix: "<answer>",
    }),
    chatMemoryRetriever,
    {
      qaChainOptions: {
        type: "stuff",
        prompt: PromptTemplate.fromTemplate(
          `You are a non-denominational Christian chatbot named 'RevelationsAI' who is trying to answer questions about the current chat conversation. Some of the chat history is provided to help you answer the question. Use that information to answer the following question. If you are unsure about your correctness, you can admit that you are not confident in your answer. Refer to the user as 'you' and yourself as 'me' or 'I'.

          The chat history is within <chat_history></chat_history> XML tags.
          The question is within <question></question> XML tags.

          <chat_history>
          {context}
          </chat_history>

          <question>
          {question}
          </question>
          
          Put your answer to the question within <answer></answer> XML tags.`
        ),
      },
      questionGeneratorChainOptions: {
        llm: getSmallContextModel(),
      },
      inputKey: "query",
      outputKey: "text",
      memory: retrievalChainMemory,
    }
  );

  const documentVectorStore = await getDocumentVectorStore({ verbose: true });
  const documentRetrieverChain = ConversationalRetrievalQAChain.fromLLM(
    getLargeContextModel({
      stream: true,
      stopSequences: ["</answer>"],
      promptSuffix: "<answer>",
    }),
    documentVectorStore.asRetriever({
      k: 25,
    }),
    {
      qaChainOptions: {
        type: "stuff",
        prompt: PromptTemplate.fromTemplate(
          `You are a non-denominational Christian chatbot named 'RevelationsAI' who is trying to answer questions about the Christian faith and theology. Use the context provided below to answer the following question. Do not say that you are referencing a context, just act like it is within your knowledge. If you truly do not have enough context to answer the question, just admit that you don't know the answer. Otherwise, confidently answer the question as if you believe it to be true.

          The context is within <context></context> XML tags.
          The question is within <question></question> XML tags.

          <context>
          {context}
          </context>

          <question>
          {question}
          </question>
          
          Put your answer to the question within <answer></answer> XML tags.`
        ),
      },
      questionGeneratorChainOptions: {
        llm: getSmallContextModel(),
      },
      inputKey: "query",
      outputKey: "text",
      memory: retrievalChainMemory,
      returnSourceDocuments: true,
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
          chain: chatMemoryRetrieverChain,
        },
        "faith-qa": {
          description:
            "Good for answering questions or generating content about the Christian faith and theology.",
          chain: documentRetrieverChain,
        },
      },
      defaultChain: "faith-qa",
    }
  );

  return multiRouteChain;
};
