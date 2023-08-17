import { llmConfig, openAiConfig } from "@core/configs";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { OpenAI as OpenAIClient } from "openai";

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
