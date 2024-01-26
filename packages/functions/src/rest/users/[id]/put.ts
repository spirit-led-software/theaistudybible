import type { UpdateUserData } from '@revelationsai/core/model/user';
import { validApiHandlerSession } from '@revelationsai/server/services/session';
import { getUser, updateUser } from '@revelationsai/server/services/user';
import { ApiHandler } from 'sst/node/api';
import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse
} from '../../../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  const data: UpdateUserData = JSON.parse(event.body ?? '{}');

  try {
    let user = await getUser(id);
    if (!user) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid || user.id !== userWithRoles.id) {
      return UnauthorizedResponse('You are not authorized to update this user');
    }

    user = await updateUser(user.id, data);
    return OkResponse(user);
  } catch (error) {
    console.error(`Error updating user '${id}':`, error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
