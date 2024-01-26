import { buildOrderBy } from '@revelationsai/core/database/helpers';
import { devotions } from '@revelationsai/core/database/schema';
import { getDevotions } from '@revelationsai/server/services/devotion';
import { ApiHandler } from 'sst/node/api';
import { OkResponse, InternalServerErrorResponse } from '../../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  const searchParams = event.queryStringParameters ?? {};
  const limit = parseInt(searchParams.limit ?? '25');
  const page = parseInt(searchParams.page ?? '1');
  const orderBy = searchParams.orderBy ?? 'createdAt';
  const order = searchParams.order ?? 'desc';

  try {
    const devos = await getDevotions({
      orderBy: buildOrderBy(devotions, orderBy, order),
      offset: (page - 1) * limit,
      limit
    });

    return OkResponse({
      entities: devos,
      page,
      perPage: limit
    });
  } catch (error) {
    console.error('Error getting devotions:', error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
