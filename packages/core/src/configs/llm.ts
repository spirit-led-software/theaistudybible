interface LLMConfig {
  promptModelName: string;
  chatModelName: string;
  completionsModelName: string;
  embeddingsModelName: string;
}

export const config: LLMConfig = {
  promptModelName: process.env.LLM_PROMPT_MODEL_NAME!,
  chatModelName: process.env.LLM_CHAT_MODEL_NAME!,
  completionsModelName: process.env.LLM_COMPLETIONS_MODEL_NAME!,
  embeddingsModelName: process.env.LLM_EMBEDDINGS_MODEL_NAME!,
};

export default config;
