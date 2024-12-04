import type { anthropic } from '@ai-sdk/anthropic';
import type { groq } from '@ai-sdk/groq';
import type { mistral } from '@ai-sdk/mistral';
import type { openai } from '@ai-sdk/openai';

export type ModelInfo = {
  id:
    | Parameters<typeof openai>[0]
    | Parameters<typeof anthropic>[0]
    | Parameters<typeof mistral>[0]
    | Parameters<typeof groq>[0];
  /**
   * The provider of the model. (Who owns and created the model)
   */
  provider: 'openai' | 'anthropic' | 'mistral' | 'meta' | 'groq';
  /**
   * Where the model is hosted.
   */
  host: 'openai' | 'anthropic' | 'mistral' | 'groq';
  name: string;
  description: string;
  contextSize: number;
  link: string;
  tier: 'free' | 'plus';
};

export const freeTierModels: ModelInfo[] = [
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

export type EmbeddingsModelInfo = {
  id: Parameters<(typeof openai)['embedding']>[0];
  provider: 'openai';
  host: 'openai';
  dimensions: number;
  chunkSize: number;
  chunkOverlap: number;
};

export const embeddingsModel: EmbeddingsModelInfo = {
  id: 'text-embedding-3-small',
  provider: 'openai',
  host: 'openai',
  dimensions: 1536,
  chunkSize: 512,
  chunkOverlap: 128,
};
