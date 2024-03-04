import type { App, Stack } from 'sst/constructs';

export const LANGSMITH_ENV_VARS = (app: App, stack: Stack) => ({
  LANGCHAIN_TRACING_V2: 'true',
  LANGCHAIN_ENDPOINT: 'https://api.smith.langchain.com',
  LANGCHAIN_API_KEY: process.env.LANGCHAIN_API_KEY!,
  LANGCHAIN_PROJECT: `${app.name}-${stack.stage}`
});
