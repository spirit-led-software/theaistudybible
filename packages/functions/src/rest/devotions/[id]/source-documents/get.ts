import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse
} from '@lib/api-responses';
import { getDevotion, getDevotionSourceDocuments } from '@services/devotion';
import { ApiHandler } from 'sst/node/api';

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;

  try {
    const devotion = await getDevotion(id);
    if (!devotion) {
      return ObjectNotFoundResponse(id);
    }

    const sourceDocuments = await getDevotionSourceDocuments(devotion);

    return OkResponse(
      sourceDocuments.map((sourceDocument) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { embedding, ...rest } = sourceDocument;
        return rest;
      })
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
