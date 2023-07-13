import { QdrantClient } from "@qdrant/js-client-rest";

export const getClient = () =>
  new QdrantClient({
    url: process.env.VECTOR_DB_URL!,
    apiKey: process.env.VECTOR_DB_API_KEY!,
  });
