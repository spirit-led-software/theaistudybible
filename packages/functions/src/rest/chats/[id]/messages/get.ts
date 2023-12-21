import { buildOrderBy } from '@core/database/helpers';
import { aiResponses } from '@core/schema';
import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse
} from '@lib/api-responses';
import { getChat, getChatMessages } from '@services/chat';
import { validApiHandlerSession } from '@services/session';
import { isObjectOwner } from '@services/user';
import { ApiHandler } from 'sst/node/api';

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;

  const searchParams = event.queryStringParameters ?? {};
  const limit = parseInt(searchParams.limit ?? '25');
  const page = parseInt(searchParams.page ?? '1');
  const orderBy = searchParams.orderBy ?? 'createdAt';
  const order = searchParams.order ?? 'desc';

  try {
    const chat = await getChat(id);
    if (!chat) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid || !isObjectOwner(chat, userWithRoles.id)) {
      return UnauthorizedResponse('You are not authorized to view this chat');
    }

    const messages = await getChatMessages(id, {
      limit,
      offset: (page - 1) * limit,
      orderBy: buildOrderBy(aiResponses, orderBy, order)
    });

    return OkResponse({
      entities: messages,
      page,
      perPage: limit
    });
  } catch (error) {
    console.error(`Error getting chat messages '${id}':`, error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
