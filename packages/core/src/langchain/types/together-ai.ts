export const mistralModelIds = [
  'mistralai/Mistral-7B-Instruct-v0.1',
  'mistralai/Mistral-7B-Instruct-v0.2',
  'mistralai/Mixtral-8x7B-Instruct-v0.1'
] as const;
export type MistralModelId = (typeof mistralModelIds)[number];

export const togetherAiModelIds = [...mistralModelIds] as const;
export type TogetherAIModelId = (typeof togetherAiModelIds)[number];
