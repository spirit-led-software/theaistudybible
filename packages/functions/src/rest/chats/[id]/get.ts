import { getChat } from '@revelationsai/server/services/chat/chat';
import { validApiHandlerSession } from '@revelationsai/server/services/session';
import { isObjectOwner } from '@revelationsai/server/services/user';
import { ApiHandler } from 'sst/node/api';
import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse
} from '../../../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;

  try {
    const chat = await getChat(id);
    if (!chat) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid || !isObjectOwner(chat, userWithRoles.id)) {
      return UnauthorizedResponse('You are not authorized to view this chat');
    }

    return OkResponse(chat);
  } catch (error) {
    console.error(`Error getting chat '${id}':`, error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
