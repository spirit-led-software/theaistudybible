import { QdrantClient } from "@qdrant/js-client-rest";
import { Document } from "langchain/document";
import { QdrantVectorStore } from "langchain/vectorstores/qdrant";
import { vectorDBConfig } from "../configs/index";
import { getEmbeddingsModel } from "./llm";

export const getQdrantClient = () =>
  new QdrantClient({
    url: vectorDBConfig.url,
    apiKey: vectorDBConfig.apiKey,
  });

export async function getVectorStore() {
  return await QdrantVectorStore.fromExistingCollection(getEmbeddingsModel(), {
    collectionName: vectorDBConfig.collectionName,
    client: getQdrantClient(),
  });
}

export async function addDocumentsToVectorStore(
  documents: Document<Record<string, any>>[]
) {
  const vectorStore = await getVectorStore();
  for (let i = 0; i < documents.length; i += 30) {
    console.log(`Adding slice: ${i} to ${i + 30}`);
    await vectorStore.addDocuments(documents.slice(i, i + 30));
  }
}

export async function initializeCollection() {
  console.log(
    `Initializing vector db collection '${vectorDBConfig.collectionName}'`
  );
  const client = getQdrantClient();
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
