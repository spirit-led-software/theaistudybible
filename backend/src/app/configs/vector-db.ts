import { QdrantClient } from '@qdrant/js-client-rest';
import { QdrantVectorStore } from 'langchain/vectorstores/qdrant';
import { getEmbeddings } from './llm';

export type VectorDbConfig = {
  url: string;
  apiKey: string;
  collectionName: string;
  size: number;
  distance: 'Euclid' | 'Cosine';
};

export const config: VectorDbConfig = {
  url: process.env.VECTOR_DB_URL,
  apiKey: process.env.VECTOR_DB_API_KEY,
  collectionName: process.env.VECTOR_DB_COLLECTION_NAME,
  size: parseInt(process.env.VECTOR_DB_COLLECTION_SIZE),
  distance: 'Cosine',
};

export const getVectorStore = async () => {
  return await QdrantVectorStore.fromExistingCollection(getEmbeddings(), {
    url: config.url,
    collectionName: config.collectionName,
    client: getClient(),
  });
};

export const getClient = () => {
  return new QdrantClient({
    url: config.url,
    apiKey: config.apiKey,
  });
};

export default config;
