import { ChatOpenAI } from 'langchain/chat_models/openai';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { OpenAI } from 'langchain/llms/openai';

type OpenAiConfig = {
  basePath: string;
  apiKey: string;
  temperature: number;
  modelName: string;
  embeddingsModelName: string;
};

export const config: OpenAiConfig = {
  basePath: process.env.OPENAI_BASE_PATH || 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY,
  temperature: parseInt(process.env.OPENAI_TEMPERATURE) || 1,
  modelName: process.env.OPENAI_MODEL_NAME || 'gpt-3.5-turbo',
  embeddingsModelName:
    process.env.OPENAI_EMBEDDINGS_MODEL_NAME || 'text-embedding-ada-002',
};

export const getEmbeddings = (options?) => {
  const { modelName } = options || {};
  return new OpenAIEmbeddings(
    {
      openAIApiKey: config.apiKey,
      modelName: modelName || config.embeddingsModelName,
    },
    {
      basePath: config.basePath,
      apiKey: config.apiKey,
    },
  );
};

export const getModel = (options?) => {
  const { temperature, modelName } = options || {};
  return new OpenAI(
    {
      openAIApiKey: config.apiKey,
      temperature: temperature || config.temperature,
      modelName: modelName || config.modelName,
    },
    {
      basePath: config.basePath,
      apiKey: config.apiKey,
    },
  );
};

export const getChatModel = (options?) => {
  const { temperature, modelName } = options || {};
  return new ChatOpenAI(
    {
      openAIApiKey: config.apiKey,
      temperature: temperature || config.temperature,
      modelName: modelName || config.modelName,
    },
    {
      basePath: config.basePath,
      apiKey: config.apiKey,
    },
  );
};

export default config;
