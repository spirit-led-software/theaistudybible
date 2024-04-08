import type { UpstashVectorStoreDocument } from '@revelationsai/core/langchain/vectorstores/upstash';
import type { SourceDocument } from '@revelationsai/core/model/source-document';
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
  const { query, filter } = JSON.parse(event.body ?? '{}');

  if (!query) {
    return BadRequestResponse('Missing query');
  }

  try {
    const vectorStore = await getDocumentVectorStore();
    const results = await vectorStore.similaritySearchWithScore(query, limit, filter);

    return OkResponse(
      // @ts-expect-error - We know the results are of the correct type
      results.map((result: [UpstashVectorStoreDocument, number]) => {
        const [doc, score] = result;
        return {
          id: doc.id.toString(),
          pageContent: doc.pageContent,
          metadata: doc.metadata,
          embedding: doc.vector,
          distance: 1 - score,
          distanceMetric: 'cosine'
        } satisfies SourceDocument;
      })
    );
  } catch (error) {
    console.error('Error getting vector similarity search results:', error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
