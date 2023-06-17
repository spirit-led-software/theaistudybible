import { client, config } from '@configs/vector-database';
import { Logger, Module } from '@nestjs/common';
import { DataType } from '@zilliz/milvus2-sdk-node';

@Module({})
export class VectorDatabaseModule {
  private readonly logger = new Logger(this.constructor.name);

  async onModuleInit() {
    this.logger.log('Initializing vector database collection');
    const { data } = await client.listCollections();
    const { name } =
      data.find((collection) => collection.name === config.collectionName) ||
      {};
    if (name) {
      this.logger.log('Milvus collection already exists.');
      return;
    }
    await client.createCollection({
      collection_name: config.collectionName,
      fields: [
        {
          name: config.primaryField,
          description: 'Primary field',
          data_type: DataType.Int64,
          is_primary_key: true,
          autoID: true,
        },
        {
          name: config.textField,
          description: 'Text field',
          data_type: DataType.VarChar,
          max_length: 400,
        },
        {
          name: config.vectorField,
          description: 'Vector field',
          data_type: DataType.FloatVector,
          dim: config.dimensions,
        },
        {
          name: 'source',
          description: 'Source field',
          data_type: DataType.VarChar,
          max_length: 256,
        },
      ],
    });
    await client.createIndex({
      collection_name: config.collectionName,
      field_name: config.vectorField,
      extra_params: {
        index_type: 'HNSW',
        metric_type: 'L2',
        params: JSON.stringify({ M: 8, efConstruction: 64 }),
      },
    });
    this.logger.log('Milvus collection has been initialized.');
  }
}
