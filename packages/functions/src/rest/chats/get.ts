import { buildOrderBy } from '@revelationsai/core/database/helpers';
import { chats as chatsTable } from '@revelationsai/core/database/schema';
import { getChats } from '@revelationsai/server/services/chat/chat';
import { validApiHandlerSession } from '@revelationsai/server/services/session';
import { eq } from 'drizzle-orm';
import { ApiHandler } from 'sst/node/api';
import {
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse
} from '../../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  const searchParams = event.queryStringParameters ?? {};
  const limit = parseInt(searchParams.limit ?? '25');
  const page = parseInt(searchParams.page ?? '1');
  const orderBy = searchParams.orderBy ?? 'createdAt';
  const order = searchParams.order ?? 'desc';

  try {
    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid) {
      return UnauthorizedResponse('You are not logged in.');
    }

    const chats = await getChats({
      where: eq(chatsTable.userId, userWithRoles.id),
      orderBy: buildOrderBy(chatsTable, orderBy, order),
      offset: (page - 1) * limit,
      limit
    });

    return OkResponse({
      entities: chats,
      page,
      perPage: limit
    });
  } catch (error) {
    console.error('Error getting chats:', error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
