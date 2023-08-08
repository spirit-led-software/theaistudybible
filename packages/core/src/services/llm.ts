import { ChatOpenAI } from "langchain/chat_models/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { Configuration, OpenAIApi } from "openai";
import config from "../configs/llm";

export const getEmbeddingsModel = () =>
  new OpenAIEmbeddings({
    openAIApiKey: config.apiKey,
    modelName: config.embeddingsModelName,
  });

export const getChatModel = () =>
  new ChatOpenAI({
    openAIApiKey: config.apiKey,
    temperature: config.temperature,
    modelName: config.completionsModelName,
    streaming: true,
    maxTokens: -1,
  });

export const getPromptModel = () =>
  new OpenAI({
    openAIApiKey: config.apiKey,
    temperature: config.temperature,
    modelName: config.promptModelName,
    maxTokens: -1,
  });

export const getCompletionsModel = () =>
  new OpenAI({
    openAIApiKey: config.apiKey,
    temperature: config.temperature,
    modelName: config.completionsModelName,
    maxTokens: -1,
  });

export const getOpenAiClient = () =>
  new OpenAIApi(
    new Configuration({
      apiKey: config.apiKey,
    })
  );