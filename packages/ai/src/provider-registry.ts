import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { experimental_createProviderRegistry as createProviderRegistry } from 'ai';
import OpenAI from 'openai';
import { Resource } from 'sst';

export const openai = new OpenAI({
  apiKey: Resource.OpenAiApiKey.value,
});

export const registry = createProviderRegistry({
  anthropic: createAnthropic({
    apiKey: Resource.AnthropicApiKey.value,
  }),
  openai: createOpenAI({
    apiKey: Resource.OpenAiApiKey.value,
  }),
});
