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

export default config;
