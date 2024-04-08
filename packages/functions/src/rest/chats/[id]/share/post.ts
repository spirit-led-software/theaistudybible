import { shareChatOptions } from '@revelationsai/core/database/schema';
import { db } from '@revelationsai/server/lib/database';
import { getChat } from '@revelationsai/server/services/chat/chat';
import { validApiHandlerSession } from '@revelationsai/server/services/session';
import { isObjectOwner } from '@revelationsai/server/services/user';
import { ApiHandler } from 'sst/node/api';
import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse
} from '../../../../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters?.id;
  if (!id) {
    return InternalServerErrorResponse('No chat ID provided');
  }

  try {
    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid) {
      return UnauthorizedResponse('You must be logged in');
    }

    const chat = await getChat(id);
    if (!chat) {
      return ObjectNotFoundResponse(id);
    }

    if (!isObjectOwner(chat, userWithRoles.id)) {
      return UnauthorizedResponse('You do not have permission to share this chat');
    }

    await db.insert(shareChatOptions).values({
      chatId: chat.id
    });

    return OkResponse({
      message: 'Chat shared successfully'
    });
  } catch (error) {
    console.error('Error sharing chat:', error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
