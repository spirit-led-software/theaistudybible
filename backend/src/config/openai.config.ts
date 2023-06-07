type OpenAiConfig = {
  apiKey: string;
  temperature: number;
  modelName: string;
};

export const config: OpenAiConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  temperature: process.env.OPENAI_TEMPERATURE
    ? parseInt(process.env.OPENAI_TEMPERATURE, 10)
    : 1,
  modelName: process.env.OPENAI_MODEL_NAME || 'gpt-3.5-turbo',
};

export default config;
