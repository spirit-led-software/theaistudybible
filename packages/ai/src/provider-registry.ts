import { createAnthropic } from '@ai-sdk/anthropic';
import { createMistral } from '@ai-sdk/mistral';
import { createOpenAI } from '@ai-sdk/openai';
import { experimental_createProviderRegistry as createProviderRegistry } from 'ai';

export const registry = createProviderRegistry({
  anthropic: createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  }),
  openai: createOpenAI({
    apiKey: process.env.OPENAI_API_KEY
  }),
  mistral: createMistral({
    apiKey: process.env.MISTRAL_API_KEY
  })
});
