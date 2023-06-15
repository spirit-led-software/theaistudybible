import { ChatOpenAI } from 'langchain/chat_models/openai';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { OpenAI } from 'langchain/llms/openai';

type OpenAiConfig = {
  apiKey: string;
  temperature: number;
  modelName: string;
  embeddingsModelName: string;
};

export const config: OpenAiConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  temperature: parseInt(process.env.OPENAI_TEMPERATURE) || 1,
  modelName: process.env.OPENAI_MODEL_NAME || 'gpt-3.5-turbo',
  embeddingsModelName:
    process.env.OPENAI_EMBEDDINGS_MODEL_NAME || 'text-embedding-ada-002',
};

export const getEmbeddings = () => {
  return new OpenAIEmbeddings({
    openAIApiKey: config.apiKey,
    modelName: config.embeddingsModelName,
    stripNewLines: true,
  });
};

export const getModel = () => {
  return new OpenAI({
    openAIApiKey: config.apiKey,
    temperature: config.temperature,
    modelName: config.modelName,
    cache: true,
  });
};

export const getChatModel = () => {
  return new ChatOpenAI({
    openAIApiKey: config.apiKey,
    temperature: config.temperature,
    modelName: config.modelName,
    cache: true,
  });
};

export default config;
