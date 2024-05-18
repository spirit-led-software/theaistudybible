import { buildOrderBy } from '@revelationsai/core/database/helpers';
import { userMessages } from '@revelationsai/core/database/schema';
import { validApiHandlerSession } from '@revelationsai/server/services/session';
import { getUserMessages } from '@revelationsai/server/services/user/message';
import { eq } from 'drizzle-orm';
import { ApiHandler } from 'sst/node/api';
import {
  UnauthorizedResponse,
  OkResponse,
  InternalServerErrorResponse
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
      return UnauthorizedResponse('You must be logged in.');
    }

    const messages = await getUserMessages({
      where: eq(userMessages.userId, userWithRoles.id),
      limit,
      offset: (page - 1) * limit,
      orderBy: buildOrderBy(userMessages, orderBy, order)
    });

    return OkResponse({
      entities: messages,
      page,
      perPage: limit
    });
  } catch (error) {
    console.error('Error getting user messages:', error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
