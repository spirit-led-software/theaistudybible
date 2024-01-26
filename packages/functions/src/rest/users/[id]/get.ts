import { getUser } from '@revelationsai/server/services/user';
import { ApiHandler } from 'sst/node/api';
import {
  ObjectNotFoundResponse,
  OkResponse,
  InternalServerErrorResponse
} from '../../../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  try {
    const user = await getUser(id);
    if (!user) {
      return ObjectNotFoundResponse(id);
    }
    return OkResponse(user);
  } catch (error) {
    console.error(`Error getting user '${id}':`, error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
