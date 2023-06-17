import { LLMConfig } from '@configs/types';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { OpenAI } from 'langchain/llms/openai';

@Injectable()
export class LLMService {
  private readonly config: LLMConfig;
  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get('llm');
  }

  getEmbeddings = () => {
    return new OpenAIEmbeddings({
      openAIApiKey: this.config.apiKey,
      modelName: this.config.embeddingsModelName,
      stripNewLines: true,
    });
  };

  getModel = () => {
    return new OpenAI({
      openAIApiKey: this.config.apiKey,
      temperature: this.config.temperature,
      modelName: this.config.modelName,
      cache: true,
    });
  };

  getChatModel = () => {
    return new ChatOpenAI({
      openAIApiKey: this.config.apiKey,
      temperature: this.config.temperature,
      modelName: this.config.modelName,
      cache: true,
    });
  };

  getConfig = () => {
    return this.config;
  };
}
