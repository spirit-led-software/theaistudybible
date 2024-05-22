import { ChatAnthropic } from '@langchain/anthropic';
import type { BaseCache } from '@langchain/core/caches';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { defaultModelId, devEmbeddingModel, embeddingModel } from '@theaistudybible/core/model/llm';
import {
  anthropicModelIds,
  type AnthropicModelId
} from '@theaistudybible/langchain/types/anthropic';
import { openAiModelIds, type OpenAiModelId } from '@theaistudybible/langchain/types/openai';

export type StandardModelInput = {
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
  cache?: BaseCache;
};

export function getEmbeddingsModelInfo() {
  return process.env.NODE_ENV === 'production' ? embeddingModel : devEmbeddingModel;
}

export function getEmbeddingsModel({ verbose }: { inputType: string; verbose?: boolean }) {
  return new OpenAIEmbeddings({
    model: getEmbeddingsModelInfo().id,
    apiKey: process.env.OPENAI_API_KEY,
    verbose
  });
}

export function getLanguageModel({
  modelId = defaultModelId,
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
      openAIApiKey: process.env.OPENAI_API_KEY,
      streaming: stream,
      stop: stopSequences,
      temperature,
      topP,
      maxTokens,
      cache,
      verbose: process.env.IS_LOCAL === 'true'
    });
  }

  if (anthropicModelIds.includes(modelId as AnthropicModelId)) {
    return new ChatAnthropic({
      modelName: modelId as AnthropicModelId,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      streaming: stream,
      stopSequences,
      temperature,
      topP,
      topK,
      maxTokens,
      cache,
      verbose: process.env.IS_LOCAL === 'true'
    });
  }

  throw new Error(`Invalid modelId: ${modelId}`);
}
