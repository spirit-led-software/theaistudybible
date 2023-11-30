import { buildOrderBy, buildQuery } from '@core/database/helpers';
import { indexOperations } from '@core/schema';
import { InternalServerErrorResponse, OkResponse, UnauthorizedResponse } from '@lib/api-responses';
import { getIndexOperations } from '@services/data-source/index-op';
import { validApiHandlerSession } from '@services/session';
import { isAdmin } from '@services/user';
import { and } from 'drizzle-orm';
import { ApiHandler } from 'sst/node/api';

export const handler = ApiHandler(async (event) => {
  const searchParams = event.queryStringParameters ?? {};
  const limit = parseInt(searchParams.limit ?? '25');
  const page = parseInt(searchParams.page ?? '1');
  const orderBy = searchParams.orderBy ?? 'createdAt';
  const order = searchParams.order ?? 'desc';
  const query = JSON.parse(event.body ?? '{}');

  console.log('Received index operations search request: ', {
    query: JSON.stringify(query),
    limit,
    page,
    orderBy,
    order
  });

  try {
    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid) {
      return UnauthorizedResponse('You must be logged in');
    }

    if (!(await isAdmin(userWithRoles.id))) {
      return UnauthorizedResponse('You must be an admin');
    }

    const indexOps = await getIndexOperations({
      where: and(buildQuery(indexOperations, query)),
      limit,
      offset: (page - 1) * limit,
      orderBy: buildOrderBy(indexOperations, orderBy, order)
    });

    return OkResponse({
      entities: indexOps,
      page,
      perPage: limit
    });
  } catch (error) {
    console.error('Error searching index operations:', error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
