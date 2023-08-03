interface LLMConfig {
  apiKey: string;
  promptModelName: string;
  completionsModelName: string;
  embeddingsModelName: string;
  temperature: number;
}

export const config: LLMConfig = {
  apiKey: process.env.LLM_API_KEY as string,
  promptModelName: process.env.LLM_PROMPT_MODEL_NAME as string,
  completionsModelName: process.env.LLM_COMPLETIONS_MODEL_NAME as string,
  embeddingsModelName: process.env.LLM_EMBEDDINGS_MODEL_NAME as string,
  temperature: parseFloat(process.env.LLM_TEMPERATURE as string),
};

export default config;
