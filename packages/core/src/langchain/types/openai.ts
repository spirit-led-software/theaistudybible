export const openAiModelIds = [
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-16k',
  'gpt-4',
  'gpt-4-32k',
  'gpt-4-turbo-preview'
] as const;
export type OpenAiModelId = (typeof openAiModelIds)[number];
