import { getDevotion } from '@revelationsai/server/services/devotion';
import { ApiHandler } from 'sst/node/api';
import {
  ObjectNotFoundResponse,
  OkResponse,
  InternalServerErrorResponse
} from '../../../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;

  try {
    const devo = await getDevotion(id);
    if (!devo) {
      return ObjectNotFoundResponse(id);
    }

    return OkResponse(devo);
  } catch (error) {
    console.error(`Error getting devotion '${id}':`, error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
