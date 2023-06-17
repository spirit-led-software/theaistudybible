import { config, getClient } from '@configs/vector-db';
import { Logger, Module } from '@nestjs/common';

@Module({})
export class VectorDatabaseModule {
  private readonly logger = new Logger(this.constructor.name);

  constructor() {}

  async onModuleInit() {
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
