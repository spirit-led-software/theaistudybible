import { ChatAnthropic } from '@langchain/anthropic';
import type { BaseCache } from '@langchain/core/caches';
import { ChatOpenAI } from '@langchain/openai';
import envConfig from '@revelationsai/core/configs/environment';
import config from '@revelationsai/core/configs/revelationsai';
import {
  RAIBedrockEmbeddings,
  type RAIBedrockEmbeddingsParams
} from '@revelationsai/core/langchain/embeddings/bedrock';
import {
  anthropicModelIds,
  type AnthropicModelId
} from '@revelationsai/core/langchain/types/anthropic';
import { openAiModelIds, type OpenAiModelId } from '@revelationsai/core/langchain/types/openai';

export type StandardModelInput = {
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
  cache?: BaseCache;
};

export function getEmbeddingsModel(options?: RAIBedrockEmbeddingsParams) {
  return new RAIBedrockEmbeddings(options);
}

export function getLanguageModel({
  modelId = config.llm.chat.defaultModel,
  temperature = 0.7,
  maxTokens = 4096,
  stopSequences = [],
  stream = false,
  topK = 50,
  topP = 0.7,
  cache
}: StandardModelInput & { modelId?: OpenAiModelId | AnthropicModelId } = {}) {
  if (openAiModelIds.includes(modelId as OpenAiModelId)) {
    return new ChatOpenAI({
      modelName: modelId as OpenAiModelId,
      openAIApiKey: config.openai.apiKey,
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
    return new ChatAnthropic({
      modelName: modelId as AnthropicModelId,
      anthropicApiKey: config.anthropic.apiKey,
      streaming: stream,
      stopSequences,
      temperature,
      topP,
      topK,
      maxTokens,
      cache,
      verbose: envConfig.isLocal
    });
  }

  throw new Error(`Invalid modelId: ${modelId}`);
}
