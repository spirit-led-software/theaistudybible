export type ModelInfo = {
  name: string;
  description: string;
  contextSize: `${number}k`;
  provider: 'bedrock' | 'openai' | 'anthropic';
  link: string;
  tier: 'free' | 'plus';
};

export const freeTierModels = {
  'claude-3-haiku-20240307': {
    name: 'Claude-3 Haiku',
    description: 'A large language model trained by Anthropic',
    contextSize: '100k',
    provider: 'anthropic',
    link: 'https://www.anthropic.com/news/claude-3-family',
    tier: 'free'
  } satisfies ModelInfo,
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    description: 'A large language model trained by OpenAI',
    contextSize: '16k',
    provider: 'openai',
    link: 'https://platform.openai.com/docs/models/gpt-3-5-turbo',
    tier: 'free'
  } satisfies ModelInfo
} as const;
export type FreeTierModelId = keyof typeof freeTierModels;
export const freeTierModelIds = Object.keys(freeTierModels) as FreeTierModelId[];

export const plusTierModels = {
  'gpt-4-turbo-preview': {
    name: 'GPT-4 Turbo',
    description: 'A large language model trained by OpenAI',
    contextSize: '128k',
    provider: 'openai',
    link: 'https://openai.com/gpt-4',
    tier: 'plus'
  } satisfies ModelInfo,
  'claude-3-opus-20240229': {
    name: 'Claude-3 Opus',
    description: 'A large language model trained by Anthropic',
    contextSize: '200k',
    provider: 'bedrock',
    link: 'https://www.anthropic.com/news/claude-3-family',
    tier: 'plus'
  } satisfies ModelInfo
} as const;
export type PlusTierModelId = keyof typeof plusTierModels;
export const plusTierModelIds = Object.keys(plusTierModels) as PlusTierModelId[];

export const allModels = {
  ...freeTierModels,
  ...plusTierModels
} as const;
