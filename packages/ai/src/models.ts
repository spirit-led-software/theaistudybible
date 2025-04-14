import type { anthropic } from '@ai-sdk/anthropic';
import type { deepseek } from '@ai-sdk/deepseek';
import type { groq } from '@ai-sdk/groq';
import type { mistral } from '@ai-sdk/mistral';
import type { openai } from '@ai-sdk/openai';
import type { google } from './provider-registry';

export type ChatModelInfo = {
  /**
   * The id of the model.
   */
  id:
    | Parameters<typeof openai>[0]
    | Parameters<typeof anthropic>[0]
    | Parameters<typeof mistral>[0]
    | Parameters<typeof groq>[0]
    | Parameters<typeof deepseek>[0]
    | Parameters<typeof google>[0];
  /**
   * The provider of the model. (Who owns and created the model)
   */
  provider: 'openai' | 'anthropic' | 'mistral' | 'meta' | 'groq' | 'deepseek' | 'google';
  /**
   * Where the model is hosted.
   */
  host: 'openai' | 'anthropic' | 'mistral' | 'groq' | 'deepseek' | 'google';
  /**
   * The name of the model.
   */
  name: string;
  /**
   * The description of the model.
   */
  description: string;
  /**
   * The context size of the model.
   */
  contextSize: number;
  /**
   * The link to the model.
   */
  link: string;
  /**
   * The tier of the model.
   */
  tier: 'basic' | 'advanced';
};

export const basicChatModels: ChatModelInfo[] = [
  {
    id: 'gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash',
    description: 'A fast and cost-efficient model trained by Google',
    contextSize: 1_048_576,
    provider: 'google',
    host: 'google',
    link: 'https://deepmind.google/technologies/gemini/flash/',
    tier: 'basic',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'A fast and cost-efficient model trained by OpenAI',
    contextSize: 128_000,
    provider: 'openai',
    host: 'openai',
    link: 'https://openai.com/index/gpt-4o-mini-advancing-cost-efficient-intelligence/',
    tier: 'basic',
  },
];

export const advancedChatModels: ChatModelInfo[] = [
  {
    id: 'gemini-2.5-pro-exp-03-25',
    name: 'Gemini 2.5 Pro',
    description: 'A complex and powerful model trained by Google',
    contextSize: 2_097_152,
    provider: 'google',
    host: 'google',
    link: 'https://deepmind.google/technologies/gemini/pro/',
    tier: 'advanced',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'The flagship model of OpenAI',
    contextSize: 128_000,
    provider: 'openai',
    host: 'openai',
    link: 'https://openai.com/index/hello-gpt-4o/',
    tier: 'advanced',
  },
  {
    id: 'o3-mini',
    name: 'GPT o3 Mini',
    description: 'A small reasoning model by OpenAI',
    contextSize: 128_000,
    provider: 'openai',
    host: 'openai',
    link: 'https://openai.com/index/openai-o3-mini/',
    tier: 'advanced',
  },
];

export const allChatModels = [...basicChatModels, ...advancedChatModels];

export const defaultChatModel = basicChatModels[0];

export type EmbeddingModelInfo = {
  /**
   * The id of the model.
   */
  id: Parameters<(typeof openai)['embedding']>[0];
  /**
   * Who owns and created the model.
   */
  provider: 'openai';
  /**
   * Where the model is hosted.
   */
  host: 'openai';
  /**
   * The number of dimensions in the embedding vector.
   */
  dimensions: number;
  /**
   * The size of the chunks to embed.
   */
  chunkSize: number;
  /**
   * The overlap between chunks.
   */
  chunkOverlap: number;
};

export const embeddingModel: EmbeddingModelInfo = {
  id: 'text-embedding-3-small',
  provider: 'openai',
  host: 'openai',
  dimensions: 1536,
  chunkSize: 512,
  chunkOverlap: 128,
};
