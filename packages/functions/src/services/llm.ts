import { llmConfig } from "@core/configs";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { Configuration, OpenAIApi } from "openai";

export const getEmbeddingsModel = () =>
  new OpenAIEmbeddings({
    openAIApiKey: llmConfig.apiKey,
    modelName: llmConfig.embeddingsModelName,
  });

export const getChatModel = (temperature?: number) =>
  new ChatOpenAI({
    openAIApiKey: llmConfig.apiKey,
    temperature: temperature ?? 1.0,
    modelName: llmConfig.chatModelName,
    streaming: true,
    maxTokens: -1,
  });

export const getPromptModel = (temperature?: number) =>
  new OpenAI({
    openAIApiKey: llmConfig.apiKey,
    temperature: temperature ?? 0.3,
    modelName: llmConfig.promptModelName,
    maxTokens: -1,
    cache: true,
  });

export const getCompletionsModel = (temperature?: number) =>
  new OpenAI({
    openAIApiKey: llmConfig.apiKey,
    temperature: temperature ?? 0.7,
    modelName: llmConfig.completionsModelName,
    maxTokens: -1,
    cache: true,
  });

export const getOpenAiClient = () =>
  new OpenAIApi(
    new Configuration({
      apiKey: llmConfig.apiKey,
    })
  );
