export type ModelProvider = 'bedrock' | 'openai' | 'togetherai';
export type ModelInfo = {
  name: string;
  description: string;
  contextSize: `${number}k`;
  provider: ModelProvider;
  link: string;
};

export const freeTierModels = {
  'mistralai/Mixtral-8x7B-Instruct-v0.1': {
    name: 'Mixtral-8x7B',
    description: 'A mixture of experts language model trained by Mistral AI',
    contextSize: '32k',
    provider: 'togetherai',
    link: 'https://huggingface.co/mistralai/Mixtral-8x7B-v0.1'
  } satisfies ModelInfo,
  'anthropic.claude-instant-v1': {
    name: 'Claude-Instant',
    description: 'A large language model trained by Anthropic',
    contextSize: '100k',
    provider: 'bedrock',
    link: 'https://www.anthropic.com/news/releasing-claude-instant-1-2'
  } satisfies ModelInfo, // TODO: Remove this from free tier
  'gpt-3.5-turbo-16k': {
    name: 'GPT-3.5',
    description: 'A large language model trained by OpenAI',
    contextSize: '16k',
    provider: 'openai',
    link: 'https://platform.openai.com/docs/models/gpt-3-5-turbo'
  } satisfies ModelInfo
} as const;
export type FreeTierModelId = keyof typeof freeTierModels;
export const freeTierModelIds = Object.keys(freeTierModels) as FreeTierModelId[];

export const plusTierModels = {
  'gpt-4-turbo-preview': {
    name: 'GPT-4',
    description: 'A large language model trained by OpenAI',
    contextSize: '128k',
    provider: 'openai',
    link: 'https://openai.com/gpt-4'
  } satisfies ModelInfo,
  'anthropic.claude-v2:1': {
    name: 'Claude-2.1',
    description: 'A large language model trained by Anthropic',
    contextSize: '200k',
    provider: 'bedrock',
    link: 'https://www.anthropic.com/news/claude-2-1'
  } satisfies ModelInfo
} as const;
export type PlusTierModelId = keyof typeof plusTierModels;
export const plusTierModelIds = Object.keys(plusTierModels) as PlusTierModelId[];
