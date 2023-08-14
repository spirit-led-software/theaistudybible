export type OpenAiConfig = {
  apiKey: string;
};

export const config: OpenAiConfig = {
  apiKey: process.env.OPENAI_API_KEY!,
};

export default config;
