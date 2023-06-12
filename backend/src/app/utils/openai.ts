import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { OpenAI } from 'langchain/llms/openai';
import { config } from '../config/openai.config';

export function createModel() {
  return new OpenAI({
    openAIApiKey: config.apiKey,
    temperature: config.temperature,
    modelName: config.modelName,
  });
}

export function createEmbeddings() {
  return new OpenAIEmbeddings({
    openAIApiKey: config.apiKey,
    modelName: config.embeddingsModelName,
  });
}
