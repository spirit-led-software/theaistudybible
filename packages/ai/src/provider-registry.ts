import { createAnthropic } from '@ai-sdk/anthropic';
import { createGroq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';
import { experimental_createProviderRegistry as createProviderRegistry } from 'ai';
import { Resource } from 'sst';

export const openai = createOpenAI({ apiKey: Resource.OpenAiApiKey.value });
export const anthropic = createAnthropic({ apiKey: Resource.AnthropicApiKey.value });
export const groq = createGroq({ apiKey: Resource.GroqApiKey.value });

export const registry = createProviderRegistry({
  openai,
  anthropic,
  groq,
});
