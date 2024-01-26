import { validApiHandlerSession } from '@revelationsai/server/services/session';
import { isObjectOwner } from '@revelationsai/server/services/user';
import { getUserMessage, updateUserMessage } from '@revelationsai/server/services/user/message';
import { ApiHandler } from 'sst/node/api';
import {
  ObjectNotFoundResponse,
  UnauthorizedResponse,
  OkResponse,
  InternalServerErrorResponse
} from '../../../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  const data = JSON.parse(event.body ?? '{}');

  try {
    let userMessage = await getUserMessage(id);
    if (!userMessage) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid || !isObjectOwner(userMessage, userWithRoles.id)) {
      return UnauthorizedResponse('You are not authorized to update this message');
    }

    userMessage = await updateUserMessage(userMessage.id, data);

    return OkResponse(userMessage);
  } catch (error) {
    console.error(`Error updating user message '${id}':`, error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
