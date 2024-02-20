import { getEmbeddingsModel } from '@revelationsai/server/lib/llm';
import { getDocumentVectorStore } from '@revelationsai/server/lib/vector-db';
import { ApiHandler } from 'sst/node/api';
import {
  BadRequestResponse,
  InternalServerErrorResponse,
  OkResponse
} from '../../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  console.log('Received vector similarity search request event', event);

  const searchParams = event.queryStringParameters ?? {};
  const limit = parseInt(searchParams.limit ?? '25');
  const page = parseInt(searchParams.page ?? '1');
  const { query, filter } = JSON.parse(event.body ?? '{}');

  if (!query) {
    return BadRequestResponse('Missing query');
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
          score
        };
      }),
      page,
      perPage: limit
    });
  } catch (error) {
    console.error('Error getting vector similarity search results:', error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
