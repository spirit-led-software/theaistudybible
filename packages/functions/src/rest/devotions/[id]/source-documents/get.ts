import { getDevotion } from '@revelationsai/server/services/devotion';
import { getSourceDocumentsByDevotionId } from '@revelationsai/server/services/source-document';
import { ApiHandler } from 'sst/node/api';
import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse
} from '../../../../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;

  try {
    const devotion = await getDevotion(id);
    if (!devotion) {
      return ObjectNotFoundResponse(id);
    }

    const sourceDocuments = await getSourceDocumentsByDevotionId(devotion.id);

    return OkResponse(
      sourceDocuments.sort((a, b) => (b.distance && a.distance ? a.distance - b.distance : 0))
    );
  } catch (error) {
    console.error(`Error getting source documents for devotion '${id}':`, error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
