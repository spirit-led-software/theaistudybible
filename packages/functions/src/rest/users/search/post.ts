import { buildOrderBy, buildQuery } from '@core/database/helpers';
import { users } from '@core/schema';
import { InternalServerErrorResponse, OkResponse, UnauthorizedResponse } from '@lib/api-responses';
import { validApiHandlerSession } from '@services/session';
import { getUsers } from '@services/user';
import { and } from 'drizzle-orm';
import { ApiHandler } from 'sst/node/api';

export const handler = ApiHandler(async (event) => {
  const searchParams = event.queryStringParameters ?? {};
  const limit = parseInt(searchParams.limit ?? '25');
  const page = parseInt(searchParams.page ?? '1');
  const orderBy = searchParams.orderBy ?? 'createdAt';
  const order = searchParams.order ?? 'desc';
  const query = JSON.parse(event.body ?? '{}');

  console.log('Received user search request: ', {
    query: JSON.stringify(query),
    limit,
    page,
    orderBy,
    order
  });

  try {
    const { isValid } = await validApiHandlerSession();
    if (!isValid) {
      return UnauthorizedResponse('You must be logged in');
    }

    const foundUsers = await getUsers({
      where: and(buildQuery(users, query)),
      limit,
      offset: (page - 1) * limit,
      orderBy: buildOrderBy(users, orderBy, order)
    });

    return OkResponse({
      entities: foundUsers,
      page,
      perPage: limit
    });
  } catch (error) {
    console.error('Error searching users:', error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
