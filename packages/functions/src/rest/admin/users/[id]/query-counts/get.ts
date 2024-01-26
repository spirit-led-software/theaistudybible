import { buildOrderBy } from '@revelationsai/core/database/helpers';
import { userQueryCounts } from '@revelationsai/core/database/schema';
import { validApiHandlerSession } from '@revelationsai/server/services/session';
import { getUser, isAdminSync } from '@revelationsai/server/services/user';
import { getUserQueryCountsByUserId } from '@revelationsai/server/services/user/query-count';
import { ApiHandler } from 'sst/node/api';
import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse
} from '../../../../../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  const searchParams = event.queryStringParameters ?? {};
  const limit = parseInt(searchParams.limit ?? '25');
  const page = parseInt(searchParams.page ?? '1');
  const orderBy = searchParams.orderBy ?? 'createdAt';
  const order = searchParams.order ?? 'desc';

  try {
    const user = await getUser(id);
    if (!user) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid || !isAdminSync(userWithRoles)) {
      return UnauthorizedResponse();
    }

    const queryCounts = await getUserQueryCountsByUserId(id, {
      limit,
      offset: (page - 1) * limit,
      orderBy: buildOrderBy(userQueryCounts, orderBy, order)
    });

    return OkResponse({
      entities: queryCounts,
      page,
      perPage: limit
    });
  } catch (error) {
    console.error('Error getting user query counts:', error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
