import { validApiHandlerSession } from '@revelationsai/server/services/session';
import { isObjectOwner } from '@revelationsai/server/services/user';
import { deleteUserMessage, getUserMessage } from '@revelationsai/server/services/user/message';
import { ApiHandler } from 'sst/node/api';
import {
  ObjectNotFoundResponse,
  UnauthorizedResponse,
  DeletedResponse,
  InternalServerErrorResponse
} from '../../../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  try {
    const userMessage = await getUserMessage(id);
    if (!userMessage) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid || !isObjectOwner(userMessage, userWithRoles.id)) {
      return UnauthorizedResponse('You are not authorized to delete this message');
    }

    await deleteUserMessage(userMessage.id);
    return DeletedResponse(userMessage.id);
  } catch (error) {
    console.error(`Error deleting user message '${id}':`, error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
