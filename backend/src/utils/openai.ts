import { OpenAI } from 'langchain/llms/openai';
import { config } from 'src/config/openai.config';

export function createModel() {
  return new OpenAI({
    openAIApiKey: config.apiKey,
    temperature: config.temperature,
    modelName: config.modelName,
  });
}
