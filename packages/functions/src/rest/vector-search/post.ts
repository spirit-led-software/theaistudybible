import {
  BadRequestResponse,
  InternalServerErrorResponse,
  OkResponse,
} from "@lib/api-responses";
import { getEmbeddingsModel } from "@services/llm";
import { getDocumentVectorStore } from "@services/vector-db";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  console.log("Received vector similarity search request event", event);

  const searchParams = event.queryStringParameters ?? {};
  const limit = parseInt(searchParams.limit ?? "25");
  const page = parseInt(searchParams.page ?? "1");
  const { query, filter } = JSON.parse(event.body ?? "{}");

  if (!query) {
    return BadRequestResponse("Missing query");
  }

  try {
    const embeddings = getEmbeddingsModel();
    const vectorStore = await getDocumentVectorStore();
    const results = await vectorStore.similaritySearchVectorWithScore(
      await embeddings.embedQuery(query),
      limit,
      filter,
      (page - 1) * limit
    );

    return OkResponse({
      entities: results.map((result) => {
        const [doc, score] = result;
        return {
          id: doc.id,
          pageContent: doc.pageContent,
          metadata: doc.metadata,
          score,
        };
      }),
      page,
      perPage: limit,
    });
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.message);
  }
});
