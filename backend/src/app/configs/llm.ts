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
  apiKey: process.env.LLM_API_KEY,
  temperature: parseInt(process.env.LLM_TEMPERATURE) || 1,
  modelName: process.env.LLM_MODEL_NAME,
  embeddingsModelName: process.env.LLM_EMBEDDINGS_MODEL_NAME,
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
