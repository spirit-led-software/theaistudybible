import envConfig from '@core/configs/env';
import upstashRedisConfig from '@core/configs/upstash-redis';
import {
  RAIBedrockEmbeddings,
  type RAIBedrockEmbeddingsParams
} from '@core/langchain/embeddings/bedrock';
import { RAIBedrock } from '@core/langchain/llms/bedrock';
import type { AnthropicModelId, CohereModelId } from '@core/langchain/types/bedrock-types';
import { UpstashRedisCache } from 'langchain/cache/upstash_redis';
import type { BaseCache } from 'langchain/schema';

export type StandardModelInput = {
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
  promptPrefix?: string;
  promptSuffix?: string;
  cache?: BaseCache;
};

export const llmCache =
  upstashRedisConfig.url && upstashRedisConfig.token
    ? new UpstashRedisCache({
        config: {
          url: upstashRedisConfig.url,
          token: upstashRedisConfig.token
        }
      })
    : undefined;

export const getEmbeddingsModel = (options?: RAIBedrockEmbeddingsParams) => {
  return new RAIBedrockEmbeddings(options);
};

export const getSmallContextModel = ({
  modelId = 'cohere.command-text-v14',
  temperature = 0.5,
  maxTokens = 2048,
  stopSequences = [],
  stream = false,
  topK = 20,
  topP = 0.5,
  promptPrefix,
  promptSuffix,
  cache
}: StandardModelInput & { modelId?: CohereModelId } = {}) =>
  new RAIBedrock({
    modelId: modelId,
    stream: stream,
    body: {
      max_tokens: maxTokens,
      temperature: temperature,
      p: topP,
      k: topK,
      stop_sequences: stopSequences,
      return_likelihoods: 'NONE'
    },
    promptPrefix,
    promptSuffix,
    cache,
    verbose: envConfig.isLocal
  });

export const getLargeContextModel = ({
  modelId = 'anthropic.claude-instant-v1',
  temperature = 0.5,
  maxTokens = 2048,
  stopSequences = [],
  stream = false,
  topK = 20,
  topP = 0.5,
  promptPrefix,
  promptSuffix,
  cache
}: StandardModelInput & { modelId?: AnthropicModelId } = {}) =>
  new RAIBedrock({
    modelId: modelId,
    stream: stream,
    body: {
      max_tokens_to_sample: maxTokens,
      temperature: temperature,
      top_p: topP,
      top_k: topK,
      stop_sequences: stopSequences
    },
    promptPrefix,
    promptSuffix,
    cache,
    verbose: envConfig.isLocal
  });