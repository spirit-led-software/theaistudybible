import { llmConfig } from "@configs/index";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";

export const embeddings = new OpenAIEmbeddings({
  openAIApiKey: llmConfig.apiKey,
  modelName: llmConfig.embeddingsModelName,
});

export const chatModel = new ChatOpenAI({
  openAIApiKey: llmConfig.apiKey,
  temperature: llmConfig.temperature,
  modelName: llmConfig.modelName,
  streaming: true,
});

export const model = new OpenAI({
  openAIApiKey: llmConfig.apiKey,
  temperature: llmConfig.temperature,
  modelName: llmConfig.modelName,
  cache: true,
});
