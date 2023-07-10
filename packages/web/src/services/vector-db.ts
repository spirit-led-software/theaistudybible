import { vectorDBConfig } from "@configs/index";
import { QdrantClient } from "@qdrant/js-client-rest";
import { QdrantVectorStore } from "langchain/vectorstores/qdrant";
import { embeddings } from "./llm";

export const client = new QdrantClient({
  url: vectorDBConfig.url,
  apiKey: vectorDBConfig.apiKey,
});

export async function getVectorStore() {
  return await QdrantVectorStore.fromExistingCollection(embeddings, {
    collectionName: vectorDBConfig.collectionName,
    client: client,
  });
}

export async function initializeCollection() {
  console.log(
    `Initializing vector db collection '${vectorDBConfig.collectionName}'`
  );
  const { collections } = await client.getCollections();
  const name = collections.find(
    (c) => c.name === vectorDBConfig.collectionName
  );
  if (name) {
    console.log("Vector db collection already exists.");
    return;
  }
  await client.createCollection(vectorDBConfig.collectionName, {
    vectors: {
      size: vectorDBConfig.collectionDimensions,
      distance: "Cosine",
    },
  });
  console.log("Vector db collection has been initialized.");
}
