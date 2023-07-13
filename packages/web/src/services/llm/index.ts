import { llmConfig } from "@configs/index";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";

export const getEmbeddingsModel = () =>
  new OpenAIEmbeddings({
    openAIApiKey: llmConfig.apiKey,
    modelName: llmConfig.embeddingsModelName,
  });

export const getChatModel = () =>
  new ChatOpenAI({
    openAIApiKey: llmConfig.apiKey,
    temperature: llmConfig.temperature,
    modelName: llmConfig.modelName,
    streaming: true,
  });

export const getCompletionsModel = () =>
  new OpenAI({
    openAIApiKey: llmConfig.apiKey,
    temperature: llmConfig.temperature,
    modelName: llmConfig.modelName,
    cache: true,
  });
