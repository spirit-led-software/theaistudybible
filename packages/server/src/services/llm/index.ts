import { TogetherAI } from '@langchain/community/llms/togetherai';
import type { BaseCache } from '@langchain/core/caches';
import { OpenAI } from '@langchain/openai';
import envConfig from '@revelationsai/core/configs/env';
import openAiConfig from '@revelationsai/core/configs/openai';
import togetherAiConfig from '@revelationsai/core/configs/togetherai';
import upstashRedisConfig from '@revelationsai/core/configs/upstash-redis';
import {
  RAIBedrockEmbeddings,
  type RAIBedrockEmbeddingsParams
} from '@revelationsai/core/langchain/embeddings/bedrock';
import { RAIBedrock } from '@revelationsai/core/langchain/llms/bedrock';
import { bedrockModelIds, type BedrockModelId } from '@revelationsai/core/langchain/types/bedrock';
import { openAiModelIds, type OpenAiModelId } from '@revelationsai/core/langchain/types/open-ai';
import {
  togetherAiModelIds,
  type TogetherAIModelId
} from '@revelationsai/core/langchain/types/together-ai';
import { UpstashRedisCache } from 'langchain/cache/upstash_redis';

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

export function getEmbeddingsModel(options?: RAIBedrockEmbeddingsParams) {
  return new RAIBedrockEmbeddings(options);
}

export function getLanguageModel({
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
}: StandardModelInput & { modelId?: BedrockModelId | TogetherAIModelId | OpenAiModelId } = {}) {
  if (togetherAiModelIds.includes(modelId as TogetherAIModelId)) {
    return new TogetherAI({
      modelName: modelId,
      apiKey: togetherAiConfig.apiKey,
      streaming: stream,
      temperature,
      maxTokens,
      topP,
      topK,
      stop: stopSequences,
      cache,
      verbose: envConfig.isLocal
    });
  } else if (openAiModelIds.includes(modelId as OpenAiModelId)) {
    return new OpenAI({
      openAIApiKey: openAiConfig.apiKey,
      streaming: stream,
      stop: stopSequences,
      temperature,
      topP,
      cache,
      verbose: envConfig.isLocal
    });
  } else if (bedrockModelIds.includes(modelId as BedrockModelId)) {
    // @ts-expect-error modelId is a BedrockModelId
    return new RAIBedrock({
      modelId: modelId as BedrockModelId,
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
  } else {
    throw new Error(`Invalid modelId: ${modelId}`);
  }
}
