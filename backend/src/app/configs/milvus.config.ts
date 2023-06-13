type MilvusConfig = {
  url: string;
  collectionName: string;
  user: string;
  password: string;
};

export const config: MilvusConfig = {
  url: process.env.MILVUS_URL || 'http://localhost:19530',
  collectionName: process.env.MILVUS_COLLECTION_NAME || 'septuagint',
  user: process.env.MILVUS_USER,
  password: process.env.MILVUS_PASSWORD,
};

export default config;
