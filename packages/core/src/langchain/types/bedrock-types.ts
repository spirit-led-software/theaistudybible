import type { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

export type AmazonModelId = 'amazon.titan-text-express-v1' | 'amazon.titan-text-lite-v1';

export type AmazonModelBody = {
  textGenerationConfig: {
    temperature: number;
    topP: number;
    maxTokenCount: number;
    stopSequences?: string[];
  };
};

export type AnthropicModelId =
  | 'anthropic.claude-v1'
  | 'anthropic.claude-instant-v1'
  | 'anthropic.claude-v2'
  | 'anthropic.claude-v2:1';

export type AnthropicModelBody = {
  temperature: number;
  top_p: number;
  top_k: number;
  max_tokens_to_sample: number;
  stop_sequences?: string[];
};

export type AI21ModelId = 'ai21.j2-ultra-v1' | 'ai21.j2-mid-v1';

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

export type CohereModelId = 'cohere.command-text-v14';

export type CohereModelBody = {
  max_tokens: number;
  temperature: number;
  p: number;
  k: number;
  stop_sequences?: string[];
  return_likelihoods?: 'NONE' | 'GENERATIONS' | 'ALL';
  num_generations?: number;
};

export type BedrockModelId = AmazonModelId | AnthropicModelId | AI21ModelId | CohereModelId;

export type BedrockInput = {
  region: string;
  stream: boolean;
  client?: BedrockRuntimeClient;
  promptPrefix?: string;
  promptSuffix?: string;
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
