export type ModelInfo = {
  id: string;
  provider: 'openai' | 'anthropic';
  name: string;
  description: string;
  contextSize: `${number}k`;
  link: string;
  tier: 'free' | 'plus';
};

export const freeTierModels: ModelInfo[] = [
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'A large language model trained by OpenAI',
    contextSize: '16k',
    provider: 'openai',
    link: 'https://platform.openai.com/docs/models/gpt-3-5-turbo',
    tier: 'free'
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude-3 Haiku',
    description: 'A large language model trained by Anthropic',
    contextSize: '100k',
    provider: 'anthropic',
    link: 'https://www.anthropic.com/news/claude-3-family',
    tier: 'free'
  }
];
export type FreeTierModelId = (typeof freeTierModels)[number]['id'];
export const freeTierModelIds = Object.keys(freeTierModels) as FreeTierModelId[];

export const plusTierModels: ModelInfo[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'A large language model trained by OpenAI',
    contextSize: '128k',
    provider: 'openai',
    link: 'https://openai.com/index/hello-gpt-4o/',
    tier: 'plus'
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude-3 Opus',
    description: 'A large language model trained by Anthropic',
    contextSize: '200k',
    provider: 'anthropic',
    link: 'https://www.anthropic.com/news/claude-3-family',
    tier: 'plus'
  }
];
export type PlusTierModelId = (typeof plusTierModels)[number]['id'];
export const plusTierModelIds = Object.keys(plusTierModels) as PlusTierModelId[];

export const allModels = {
  ...freeTierModels,
  ...plusTierModels
};

export const allModelIds = Object.keys(allModels) as (FreeTierModelId | PlusTierModelId)[];
export type ModelId = (typeof allModelIds)[number];

export const defaultModel = freeTierModels[0];

export type EmbeddingModelInfo = {
  id: string;
  dimensions: number;
  chunkSize: number;
  chunkOverlap: number;
};

export const embeddingModel: EmbeddingModelInfo = {
  id: 'text-embedding-3-large',
  dimensions: 3072,
  chunkSize: 1024,
  chunkOverlap: 256
};

export const devEmbeddingModel: EmbeddingModelInfo = {
  id: 'text-embedding-ada-002',
  dimensions: 1536,
  chunkSize: 1024,
  chunkOverlap: 256
};
