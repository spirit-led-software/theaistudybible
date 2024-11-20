import type { anthropic } from '@ai-sdk/anthropic';
import type { openai } from '@ai-sdk/openai';

export type ModelInfo = {
  id: Parameters<typeof openai>[0] | Parameters<typeof anthropic>[0];
  provider: 'openai' | 'anthropic' | 'mistral' | 'meta';
  host: 'openai' | 'anthropic' | 'mistral' | 'groq';
  name: string;
  description: string;
  contextSize: number;
  link: string;
  tier: 'free' | 'plus';
};

export const freeTierModels: ModelInfo[] = [
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B',
    description: 'A large language model trained by Meta',
    contextSize: 128_000,
    provider: 'meta',
    host: 'groq',
    link: 'https://ai.meta.com/blog/meta-llama-3-1',
    tier: 'free',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'A large language model trained by OpenAI',
    contextSize: 128_000,
    provider: 'openai',
    host: 'openai',
    link: 'https://openai.com/index/gpt-4o-mini-advancing-cost-efficient-intelligence/',
    tier: 'free',
  },
];
export type FreeTierModelId = (typeof freeTierModels)[number]['id'];
export const freeTierModelIds = freeTierModels.map((model) => model.id);

export const plusTierModels: ModelInfo[] = [
  {
    id: 'llama-3.1-70b-versatile',
    name: 'Llama 3.1 70B',
    description: 'A large language model trained by Meta',
    contextSize: 128_000,
    provider: 'meta',
    host: 'groq',
    link: 'https://ai.meta.com/blog/meta-llama-3-1',
    tier: 'plus',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'A large language model trained by OpenAI',
    contextSize: 128_000,
    provider: 'openai',
    host: 'openai',
    link: 'https://openai.com/index/hello-gpt-4o/',
    tier: 'plus',
  },
  {
    id: 'claude-3-5-sonnet-latest',
    name: 'Claude 3.5 Sonnet',
    description: 'A large language model trained by Anthropic',
    contextSize: 200_000,
    provider: 'anthropic',
    host: 'anthropic',
    link: 'https://www.anthropic.com/news/claude-3-5-sonnet',
    tier: 'plus',
  },
];
export type PlusTierModelId = (typeof plusTierModels)[number]['id'];
export const plusTierModelIds = plusTierModels.map((model) => model.id);

export const allModels = [...freeTierModels, ...plusTierModels];

export const allModelIds = allModels.map((model) => model.id);
export type ModelId = (typeof allModelIds)[number];

export const defaultModel = freeTierModels[0];

export type EmbeddingModelInfo = {
  id: Parameters<(typeof openai)['embedding']>[0];
  dimensions: number;
  chunkSize: number;
  chunkOverlap: number;
};

export const embeddingModel: EmbeddingModelInfo = {
  id: 'text-embedding-3-large',
  dimensions: 3072,
  chunkSize: 1024,
  chunkOverlap: 256,
};

export const devEmbeddingModel: EmbeddingModelInfo = {
  id: 'text-embedding-ada-002',
  dimensions: 1536,
  chunkSize: 1024,
  chunkOverlap: 256,
};
