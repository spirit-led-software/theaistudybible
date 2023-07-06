export type LLMConfig = {
  apiKey: string;
  modelName: string;
  embeddingsModelName: string;
  temperature: number;
};

export const config: LLMConfig = {
  apiKey: process.env.LLM_API_KEY as string,
  modelName: process.env.LLM_MODEL_NAME as string,
  embeddingsModelName: process.env.LLM_EMBEDDINGS_MODEL_NAME as string,
  temperature: parseFloat(process.env.LLM_TEMPERATURE as string),
};

export default config;
