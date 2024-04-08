import { aiResponses, shareChatOptions } from '@revelationsai/core/database/schema';
import { db } from '@revelationsai/server/lib/database';
import { createAiResponse } from '@revelationsai/server/services/ai-response';
import { createChat, getChat } from '@revelationsai/server/services/chat';
import { validApiHandlerSession } from '@revelationsai/server/services/session';
import { createUserMessage } from '@revelationsai/server/services/user/message';
import { and, eq } from 'drizzle-orm';
import { ApiHandler } from 'sst/node/api';
import {
  BadRequestResponse,
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

    const share = (
      await db.select().from(shareChatOptions).where(eq(shareChatOptions.chatId, chat.id)).limit(1)
    ).at(0);
    if (!share) {
      return BadRequestResponse('Chat not shared');
    }

    const createdChat = await createChat({
      createdAt: chat.createdAt,
      name: chat.name,
      customName: chat.customName,
      userId: userWithRoles.id
    });

    const responses = await db
      .select()
      .from(aiResponses)
      .where(
        and(
          eq(aiResponses.chatId, chat.id),
          eq(aiResponses.failed, false),
          eq(aiResponses.regenerated, false)
        )
      );

    await Promise.all(
      responses.map(async (response) => {
        const message = await db.query.userMessages.findFirst({
          where: ({ id }, { eq }) => eq(id, response.userMessageId)
        });
        if (!message) {
          return;
        }

        const createdUserMessage = await createUserMessage({
          chatId: createdChat.id,
          userId: userWithRoles.id,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
          text: message.text,
          anonymous: true
        });
        await createAiResponse({
          chatId: createdChat.id,
          userMessageId: createdUserMessage.id,
          userId: userWithRoles.id,
          createdAt: response.createdAt,
          updatedAt: response.updatedAt,
          text: response.text,
          modelId: response.modelId,
          searchQueries: response.searchQueries
        });
      })
    );

    return OkResponse({
      message: 'Chat cloned from shared chat successfully'
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
