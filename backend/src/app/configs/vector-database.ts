import { MilvusClient } from '@zilliz/milvus2-sdk-node';
import { Milvus } from 'langchain/vectorstores/milvus';
import { getEmbeddings } from './llm';

type VectorStoreConfig = {
  url: string;
  collectionName: string;
  dimensions: number;
  user: string;
  password: string;
  primaryField: string;
  textField: string;
  vectorField: string;
};

export const config: VectorStoreConfig = {
  url: process.env.MILVUS_URL || 'http://localhost:19530',
  collectionName: process.env.MILVUS_COLLECTION_NAME || 'septuagint',
  dimensions: parseInt(process.env.MILVUS_DIMENSIONS) || 1536,
  user: process.env.MILVUS_USER,
  password: process.env.MILVUS_PASSWORD,
  primaryField: 'id',
  textField: 'text',
  vectorField: 'embedding',
};

export const getVectorStore = async () => {
  return await Milvus.fromExistingCollection(getEmbeddings(), {
    url: config.url,
    collectionName: config.collectionName,
    username: config.user,
    password: config.password,
    primaryField: config.primaryField,
    textField: config.textField,
    vectorField: config.vectorField,
  });
};

export const client = new MilvusClient({
  address: config.url,
  username: config.user,
  password: config.password,
});

export default config;
