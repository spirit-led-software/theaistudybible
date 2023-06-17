import { getClient, VectorDbConfig } from '@configs/vector-db';
import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Module({})
export class VectorDatabaseModule {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const config = this.configService.get<VectorDbConfig>('vectorDb');
    this.logger.log(
      `Initializing vector db collection '${config.collectionName}'`,
    );
    const client = getClient();
    const { collections } = await client.getCollections();
    const name = collections.find((c) => c.name === config.collectionName);
    if (name) {
      this.logger.log('Vector db collection already exists.');
      return;
    }
    await client.createCollection(config.collectionName, {
      vectors: {
        size: config.size,
        distance: config.distance,
      },
    });
    this.logger.log('Vector db collection has been initialized.');
  }
}
