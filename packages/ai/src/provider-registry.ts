import { createAnthropic } from '@ai-sdk/anthropic';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';
import { experimental_createProviderRegistry as createProviderRegistry } from 'ai';
import { Resource } from 'sst';

export const openai = createOpenAI({ apiKey: Resource.OpenAiApiKey.value });
export const anthropic = createAnthropic({ apiKey: Resource.AnthropicApiKey.value });
export const groq = createGroq({ apiKey: Resource.GroqApiKey.value });
export const deepseek = createDeepSeek({ apiKey: Resource.DeepSeekApiKey.value });
export const google = createGoogleGenerativeAI({ apiKey: Resource.GoogleAiApiKey.value });

export const registry = createProviderRegistry({ openai, anthropic, groq, deepseek, google });
