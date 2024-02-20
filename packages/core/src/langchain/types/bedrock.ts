import type { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

export const amazonModelIds = [
  'amazon.titan-text-express-v1',
  'amazon.titan-text-lite-v1'
] as const;
export type AmazonModelId = (typeof amazonModelIds)[number];

export type AmazonModelBody = {
  textGenerationConfig: {
    temperature: number;
    topP: number;
    maxTokenCount: number;
    stopSequences?: string[];
  };
};

export const anthropicModelIds = [
  'anthropic.claude-v1',
  'anthropic.claude-instant-v1',
  'anthropic.claude-v2',
  'anthropic.claude-v2:1'
] as const;
export type AnthropicModelId = (typeof anthropicModelIds)[number];

export type AnthropicModelBody = {
  temperature: number;
  top_p: number;
  top_k: number;
  max_tokens_to_sample: number;
  stop_sequences?: string[];
};

export const ai21ModelIds = ['ai21.j2-ultra-v1', 'ai21.j2-mid-v1'] as const;
export type AI21ModelId = (typeof ai21ModelIds)[number];

export type AI21ModelBody = {
  temperature: number;
  topP: number;
  maxTokens: number;
  stopSequences: string[];
  countPenalty: {
    scale: number;
  };
  presencePenalty: {
    scale: number;
  };
  frequencyPenalty: {
    scale: number;
  };
};

export const cohereModelIds = ['cohere.command-text-v14', 'cohere.command-light-text-v14'] as const;
export type CohereModelId = (typeof cohereModelIds)[number];

export type CohereModelBody = {
  max_tokens: number;
  temperature: number;
  p: number;
  k: number;
  stop_sequences?: string[];
  return_likelihoods?: 'NONE' | 'GENERATIONS' | 'ALL';
  num_generations?: number;
};

export const bedrockModelIds = [
  ...amazonModelIds,
  ...anthropicModelIds,
  ...ai21ModelIds,
  ...cohereModelIds
] as const;
export type BedrockModelId = (typeof bedrockModelIds)[number];

export type BedrockInput = {
  region: string;
  stream: boolean;
  client?: BedrockRuntimeClient;
  promptPrefix?: string;
  promptSuffix?: string;
  completionPrefix?: string;
} & (
  | {
      modelId: AmazonModelId;
      body: AmazonModelBody;
    }
  | {
      modelId: AnthropicModelId;
      body: AnthropicModelBody;
    }
  | {
      modelId: AI21ModelId;
      body: AI21ModelBody;
    }
  | {
      modelId: CohereModelId;
      body: CohereModelBody;
    }
);
