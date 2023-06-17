import { VectorDbConfig } from '@configs/types';
import { LLMService } from '@modules/llm/llm.service';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import { QdrantVectorStore } from 'langchain/vectorstores/qdrant';

@Injectable()
export class VectorDBService {
  private readonly logger = new Logger(this.constructor.name);
  private readonly config: VectorDbConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly llmService: LLMService,
  ) {
    this.config = this.configService.get('vectorDb');
  }

  initializeCollection = async () => {
    this.logger.log(
      `Initializing vector db collection '${this.config.collectionName}'`,
    );
    const client = this.getClient();
    const { collections } = await client.getCollections();
    const name = collections.find((c) => c.name === this.config.collectionName);
    if (name) {
      this.logger.log('Vector db collection already exists.');
      return;
    }
    await client.createCollection(this.config.collectionName, {
      vectors: {
        size: this.config.size,
        distance: this.config.distance,
      },
    });
    this.logger.log('Vector db collection has been initialized.');
  };

  getVectorStore = async () => {
    return await QdrantVectorStore.fromExistingCollection(
      this.llmService.getEmbeddings(),
      {
        url: this.config.url,
        collectionName: this.config.collectionName,
        client: this.getClient(),
      },
    );
  };

  getClient = () => {
    return new QdrantClient({
      url: this.config.url,
      apiKey: this.config.apiKey,
    });
  };
}
