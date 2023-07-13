import { getClient } from "../lib/client";
import { loadEnvironment } from "../lib/env";

export async function main() {
  loadEnvironment();

  const collectionName = process.env.VECTOR_DB_COLLECTION_NAME!;

  const client = getClient();
  const results = await client.scroll(collectionName, {
    limit: 1000000,
    filter: {
      must: [
        {
          key: "metadata.name",
          match: {
            value: "Enduring Word - ",
          },
        },
      ],
    },
  });

  results.points.forEach((point) => {
    console.log(JSON.stringify(point.payload));
    if (point.payload) {
      const metadata: any = point.payload.metadata;
      client.overwritePayload(collectionName, {
        points: [point.id],
        payload: {
          ...point.payload,
          metadata: {
            ...metadata,
            name: metadata.name.replace(
              "Enduring Word - ",
              `Enduring Word - ${metadata.url}`
            ),
          },
        },
      });
    }
  });
}

main();
