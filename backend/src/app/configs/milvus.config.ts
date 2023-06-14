import { Milvus } from 'langchain/vectorstores/milvus';
import { getEmbeddings } from './openai.config';

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

export const getVectorStore = async (options?) => {
  const { collectionName, embeddingsModelName } = options || {};
  return await Milvus.fromExistingCollection(
    getEmbeddings({ modelName: embeddingsModelName }),
    {
      url: config.url,
      collectionName: collectionName || config.collectionName,
      username: config.user,
      password: config.password,
    },
  );
};

export default config;
