export type ModelInfo = {
  name: string;
  description: string;
  contextSize: `${number}k`;
  provider: 'bedrock' | 'openai' | 'fireworks' | 'google';
  link: string;
  tier: 'free' | 'plus';
};

export const freeTierModels = {
  'gpt-3.5-turbo': {
    name: 'GPT-3.5',
    description: 'A large language model trained by OpenAI',
    contextSize: '16k',
    provider: 'openai',
    link: 'https://platform.openai.com/docs/models/gpt-3-5-turbo',
    tier: 'free'
  } satisfies ModelInfo,
  'anthropic.claude-instant-v1': {
    name: 'Claude-Instant',
    description: 'A large language model trained by Anthropic',
    contextSize: '100k',
    provider: 'bedrock',
    link: 'https://www.anthropic.com/news/releasing-claude-instant-1-2',
    tier: 'free'
  } satisfies ModelInfo // TODO: Remove this from free tier
} as const;
export type FreeTierModelId = keyof typeof freeTierModels;
export const freeTierModelIds = Object.keys(freeTierModels) as FreeTierModelId[];

export const plusTierModels = {
  'gpt-4-turbo-preview': {
    name: 'GPT-4',
    description: 'A large language model trained by OpenAI',
    contextSize: '128k',
    provider: 'openai',
    link: 'https://openai.com/gpt-4',
    tier: 'plus'
  } satisfies ModelInfo,
  'anthropic.claude-v2:1': {
    name: 'Claude-2.1',
    description: 'A large language model trained by Anthropic',
    contextSize: '200k',
    provider: 'bedrock',
    link: 'https://www.anthropic.com/news/claude-2-1',
    tier: 'plus'
  } satisfies ModelInfo
} as const;
export type PlusTierModelId = keyof typeof plusTierModels;
export const plusTierModelIds = Object.keys(plusTierModels) as PlusTierModelId[];

export const allModels = {
  ...freeTierModels,
  ...plusTierModels
} as const;
