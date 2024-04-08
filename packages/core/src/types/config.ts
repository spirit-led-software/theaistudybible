import type { BedrockEmbeddingModelId } from '../langchain/types/bedrock';
import type { allModels } from '../model/llm';

export type RAIConfig = {
  llm: {
    chat: {
      defaultModel: keyof typeof allModels;
    };
    embeddings: {
      model: BedrockEmbeddingModelId;
      dimensions: number;
      chunkSize: number;
      chunkOverlap: number;
    };
  };
  anthropic: {
    apiKey: string;
  };
  openai: {
    apiKey: string;
  };
  auth: {
    google: {
      clientId: string;
    };
    apple: {
      teamId: string;
      keyId: string;
      clientId: string;
    };
    admin: {
      email: string;
      password: string;
    };
  };
  email: {
    from: string;
    replyTo: string;
    host: string;
    port: number;
    credentials: {
      username: string;
      password: string;
    };
  };
  revenueCat: {
    projectId: string;
    apiKey: string;
  };
  stripe: {
    apiKey: string;
  };
  unstructured: {
    apiKey: string;
  };
  website: {
    url: string;
    authUrl: string;
  };
};
