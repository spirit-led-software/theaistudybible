import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse
} from '@lib/api-responses';
import { getUser } from '@services/user';
import { ApiHandler } from 'sst/node/api';

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  try {
    const user = await getUser(id);
    if (!user) {
      return ObjectNotFoundResponse(id);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- passwordHash is removed
    const { passwordHash, ...rest } = user;
    return OkResponse(rest);
  } catch (error) {
    console.error(`Error getting user '${id}':`, error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
