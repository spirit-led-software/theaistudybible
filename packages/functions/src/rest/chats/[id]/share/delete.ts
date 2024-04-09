import { shareChatOptions } from '@revelationsai/core/database/schema';
import { db } from '@revelationsai/server/lib/database';
import { getChat } from '@revelationsai/server/services/chat/chat';
import { validApiHandlerSession } from '@revelationsai/server/services/session';
import { isObjectOwner } from '@revelationsai/server/services/user';
import { eq } from 'drizzle-orm';
import { ApiHandler } from 'sst/node/api';
import {
  BadRequestResponse,
  DeletedResponse,
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
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
      return UnauthorizedResponse('You do not have permission to unshare this chat');
    }

    const shareChat = await db.query.shareChatOptions.findFirst({
      where: ({ chatId }, { eq }) => eq(chatId, chat.id)
    });
    if (!shareChat) {
      return BadRequestResponse('Chat is not shared');
    }

    await db.delete(shareChatOptions).where(eq(shareChatOptions.chatId, chat.id));

    return DeletedResponse(shareChat.id);
  } catch (error) {
    console.error('Error unsharing chat:', error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
