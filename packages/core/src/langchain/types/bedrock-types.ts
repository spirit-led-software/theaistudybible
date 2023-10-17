import type { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";

export type BedrockInput = {
  region: string;
  modelId: string;
  body: string | Record<string, any>;
  streaming: boolean;
  client?: BedrockRuntimeClient;
  promptPrefix?: string;
  promptSuffix?: string;
};
