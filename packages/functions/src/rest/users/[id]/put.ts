import type { UpdateUserData } from '@core/model';
import {
  BadRequestResponse,
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse
} from '@lib/api-responses';
import { validApiHandlerSession } from '@services/session';
import { getUser, updateUser } from '@services/user';
import { ApiHandler } from 'sst/node/api';

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

    if (data.passwordHash) {
      return BadRequestResponse('You cannot change your password here.');
    }

    user = await updateUser(user.id, data);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- passwordHash is removed
    const { passwordHash, ...rest } = user;
    return OkResponse(rest);
  } catch (error) {
    console.error(`Error updating user '${id}':`, error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
