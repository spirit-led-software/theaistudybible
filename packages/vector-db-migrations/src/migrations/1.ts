import { getClient } from "../lib/client";
import { loadEnvironment } from "../lib/env";

export async function main() {
  loadEnvironment();

  const collectionName = process.env.VECTOR_DB_COLLECTION_NAME!;
  const collectionDimensions = parseInt(
    process.env.VECTOR_DB_COLLECTION_DIMENSIONS || "1536"
  );

  const client = getClient();
  const { collections } = await client.getCollections();
  const name = collections.find((c) => c.name === collectionName);
  if (name) {
    console.log("Vector db collection already exists.");
    return;
  }
  await client.createCollection(collectionName, {
    vectors: {
      size: collectionDimensions,
      distance: "Cosine",
    },
  });
}

main();
