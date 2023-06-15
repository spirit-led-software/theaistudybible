import { client, config } from '@configs/milvus';
import { Logger, Module } from '@nestjs/common';
import { DataType } from '@zilliz/milvus2-sdk-node';

@Module({})
export class MilvusModule {
  private readonly logger = new Logger(this.constructor.name);

  async onModuleInit() {
    this.logger.log('Initializing Milvus collection');
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
