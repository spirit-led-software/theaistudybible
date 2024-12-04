import type { anthropic } from '@ai-sdk/anthropic';
import type { groq } from '@ai-sdk/groq';
import type { mistral } from '@ai-sdk/mistral';
import type { openai } from '@ai-sdk/openai';

export type ChatModelInfo = {
  /**
   * The id of the model.
   */
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
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'A large language model trained by OpenAI',
    contextSize: 128_000,
    provider: 'openai',
    host: 'openai',
    link: 'https://openai.com/index/gpt-4o-mini-advancing-cost-efficient-intelligence/',
    tier: 'basic',
  },
];

export const advancedChatModels: ChatModelInfo[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'A large language model trained by OpenAI',
    contextSize: 128_000,
    provider: 'openai',
    host: 'openai',
    link: 'https://openai.com/index/hello-gpt-4o/',
    tier: 'advanced',
  },
  {
    id: 'claude-3-5-sonnet-latest',
    name: 'Claude 3.5 Sonnet',
    description: 'A large language model trained by Anthropic',
    contextSize: 200_000,
    provider: 'anthropic',
    host: 'anthropic',
    link: 'https://www.anthropic.com/news/claude-3-5-sonnet',
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
