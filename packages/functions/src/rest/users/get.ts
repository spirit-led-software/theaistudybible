import { buildOrderBy } from '@core/database/helpers';
import { users as usersTable } from '@core/schema';
import { InternalServerErrorResponse, OkResponse } from '@lib/api-responses';
import { getUsers } from '@services/user';
import { ApiHandler } from 'sst/node/api';

export const handler = ApiHandler(async (event) => {
  const searchParams = event.queryStringParameters ?? {};
  const limit = parseInt(searchParams.limit ?? '25');
  const page = parseInt(searchParams.page ?? '1');
  const orderBy = searchParams.orderBy ?? 'createdAt';
  const order = searchParams.order ?? 'desc';

  try {
    const users = await getUsers({
      limit,
      offset: (page - 1) * limit,
      orderBy: buildOrderBy(usersTable, orderBy, order)
    });

    return OkResponse({
      entities: users.map((user) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- passwordHash is removed
        const { passwordHash, ...rest } = user;
        return rest;
      }),
      page,
      perPage: limit
    });
  } catch (error) {
    console.error('Error getting users:', error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
