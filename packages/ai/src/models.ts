import { anthropic } from '@ai-sdk/anthropic';
import { mistral } from '@ai-sdk/mistral';
import { openai } from '@ai-sdk/openai';

export type ModelInfo = {
  id:
    | Parameters<typeof openai>[0]
    | Parameters<typeof anthropic>[0]
    | Parameters<typeof mistral>[0];
  provider: 'openai' | 'anthropic' | 'mistral';
  name: string;
  description: string;
  contextSize: number;
  link: string;
  tier: 'free' | 'plus';
};

export const freeTierModels: ModelInfo[] = [
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'A large language model trained by OpenAI',
    contextSize: 16_000,
    provider: 'openai',
    link: 'https://platform.openai.com/docs/models/gpt-3-5-turbo',
    tier: 'free'
  }
];
export type FreeTierModelId = (typeof freeTierModels)[number]['id'];
export const freeTierModelIds = freeTierModels.map((model) => model.id) as FreeTierModelId[];

export const plusTierModels: ModelInfo[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'A large language model trained by OpenAI',
    contextSize: 128_000,
    provider: 'openai',
    link: 'https://openai.com/index/hello-gpt-4o/',
    tier: 'plus'
  },
  {
    id: 'claude-3-5-sonnet-20240620',
    name: 'Claude-3.5 Sonnet',
    description: 'A large language model trained by Anthropic',
    contextSize: 200_000,
    provider: 'anthropic',
    link: 'https://www.anthropic.com/news/claude-3-5-sonnet',
    tier: 'plus'
  }
];
export type PlusTierModelId = (typeof plusTierModels)[number]['id'];
export const plusTierModelIds = plusTierModels.map((model) => model.id) as PlusTierModelId[];

export const allModels = [...freeTierModels, ...plusTierModels];

export const allModelIds = allModels.map((model) => model.id) as (
  | FreeTierModelId
  | PlusTierModelId
)[];
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
  chunkOverlap: 256
};

export const devEmbeddingModel: EmbeddingModelInfo = {
  id: 'text-embedding-ada-002',
  dimensions: 1536,
  chunkSize: 1024,
  chunkOverlap: 256
};
