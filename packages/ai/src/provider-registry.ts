import { createAnthropic } from '@ai-sdk/anthropic';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';
import { experimental_createProviderRegistry as createProviderRegistry } from 'ai';
import { Resource } from 'sst';

let currentOpenAI: ReturnType<typeof createOpenAI> | undefined;
export const openai = () => {
  if (!currentOpenAI) {
    currentOpenAI = createOpenAI({ apiKey: Resource.OpenAiApiKey.value });
  }
  return currentOpenAI;
};

let currentAnthropic: ReturnType<typeof createAnthropic> | undefined;
export const anthropic = () => {
  if (!currentAnthropic) {
    currentAnthropic = createAnthropic({ apiKey: Resource.AnthropicApiKey.value });
  }
  return currentAnthropic;
};

let currentGroq: ReturnType<typeof createGroq> | undefined;
export const groq = () => {
  if (!currentGroq) {
    currentGroq = createGroq({ apiKey: Resource.GroqApiKey.value });
  }
  return currentGroq;
};

let currentDeepSeek: ReturnType<typeof createDeepSeek> | undefined;
export const deepseek = () => {
  if (!currentDeepSeek) {
    currentDeepSeek = createDeepSeek({ apiKey: Resource.DeepSeekApiKey.value });
  }
  return currentDeepSeek;
};

let currentGoogle: ReturnType<typeof createGoogleGenerativeAI> | undefined;
export const google = () => {
  if (!currentGoogle) {
    currentGoogle = createGoogleGenerativeAI({ apiKey: Resource.GoogleAiApiKey.value });
  }
  return currentGoogle;
};

let currentRegistry: ReturnType<typeof createProviderRegistry> | undefined;
export const registry = () => {
  if (!currentRegistry) {
    currentRegistry = createProviderRegistry({
      openai: openai(),
      anthropic: anthropic(),
      groq: groq(),
      deepseek: deepseek(),
      google: google(),
    });
  }
  return currentRegistry;
};
