import type { BaseCache } from '@langchain/core/caches';
import { OpenAI } from '@langchain/openai';
import envConfig from '@revelationsai/core/configs/env';
import openAiConfig from '@revelationsai/core/configs/openai';
import upstashRedisConfig from '@revelationsai/core/configs/upstash-redis';
import {
  RAIBedrockEmbeddings,
  type RAIBedrockEmbeddingsParams
} from '@revelationsai/core/langchain/embeddings/bedrock';
import { RAIBedrock } from '@revelationsai/core/langchain/llms/bedrock';
import {
  anthropicModelIds,
  type AnthropicModelId
} from '@revelationsai/core/langchain/types/bedrock';
import { openAiModelIds, type OpenAiModelId } from '@revelationsai/core/langchain/types/openai';
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
  completionPrefix?: string;
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
  modelId = 'gpt-3.5-turbo',
  temperature = 0.7,
  maxTokens = 4096,
  stopSequences = [],
  stream = false,
  topK = 50,
  topP = 0.7,
  promptPrefix,
  promptSuffix,
  completionPrefix,
  cache
}: StandardModelInput & { modelId?: OpenAiModelId | AnthropicModelId } = {}) {
  if (openAiModelIds.includes(modelId as OpenAiModelId)) {
    if (promptPrefix || promptSuffix || completionPrefix) {
      throw new Error('Prompt/completion prefixes/suffixes are not supported for OpenAI models');
    }
    return new OpenAI({
      modelName: modelId as OpenAiModelId,
      openAIApiKey: openAiConfig.apiKey,
      streaming: stream,
      stop: stopSequences,
      temperature,
      topP,
      maxTokens,
      cache,
      verbose: envConfig.isLocal
    });
  }

  if (anthropicModelIds.includes(modelId as AnthropicModelId)) {
    return new RAIBedrock({
      modelId: modelId as AnthropicModelId,
      stream: stream,
      promptPrefix,
      promptSuffix: promptSuffix || '\nPut your output within <output></output> XML tags.',
      completionPrefix: completionPrefix || '<output>',
      body: {
        max_tokens_to_sample: maxTokens,
        temperature: temperature,
        top_p: topP,
        top_k: topK,
        stop_sequences: stopSequences || ['</output>']
      },
      cache,
      verbose: envConfig.isLocal
    });
  }

  throw new Error(`Invalid modelId: ${modelId}`);
}
