import { envConfig, upstashRedisConfig } from "@core/configs";
import { RAIBedrock } from "@core/langchain/llms/bedrock";
import type {
  AnthropicModelId,
  CohereModelId,
} from "@core/langchain/types/bedrock-types";
import { UpstashRedisCache } from "langchain/cache/upstash_redis";
import { BedrockEmbeddings } from "langchain/embeddings/bedrock";

export type StandardModelInput = {
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
  promptPrefix?: string;
  promptSuffix?: string;
};

const cache =
  upstashRedisConfig.url && upstashRedisConfig.token
    ? new UpstashRedisCache({
        config: {
          url: upstashRedisConfig.url,
          token: upstashRedisConfig.token,
        },
      })
    : undefined;

export const getEmbeddingsModel = () =>
  new BedrockEmbeddings({
    model: "amazon.titan-embed-text-v1",
  });

export const getSmallContextModel = ({
  modelId = "cohere.command-text-v14",
  temperature = 2,
  maxTokens = 2048,
  stopSequences = [],
  stream = false,
  topK = 100,
  topP = 0.25,
  promptPrefix,
  promptSuffix,
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
      return_likelihoods: "NONE",
    },
    promptPrefix,
    promptSuffix,
    cache,
    verbose: envConfig.isLocal,
  });

export const getLargeContextModel = ({
  modelId = "anthropic.claude-instant-v1",
  temperature = 0.7,
  maxTokens = 2048,
  stopSequences = [],
  stream = false,
  topK = 250,
  topP = 0.75,
  promptPrefix,
  promptSuffix,
}: StandardModelInput & { modelId?: AnthropicModelId } = {}) =>
  new RAIBedrock({
    modelId: modelId,
    stream: stream,
    body: {
      max_tokens_to_sample: maxTokens,
      temperature: temperature,
      top_p: topP,
      top_k: topK,
      stop_sequences: stopSequences,
    },
    promptPrefix,
    promptSuffix,
    cache,
    verbose: envConfig.isLocal,
  });
