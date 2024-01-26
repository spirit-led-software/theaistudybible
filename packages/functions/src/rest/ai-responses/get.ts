import { buildOrderBy } from '@revelationsai/core/database/helpers';
import { aiResponses as aiResponsesTable } from '@revelationsai/core/database/schema';
import { getAiResponses } from '@revelationsai/server/services/ai-response/ai-response';
import { validApiHandlerSession } from '@revelationsai/server/services/session';
import { and, eq } from 'drizzle-orm';
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
  const includeFailed = searchParams.includeFailed === 'true';

  try {
    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid) {
      return UnauthorizedResponse('You must be logged in');
    }

    const aiResponses = await getAiResponses({
      where: and(
        eq(aiResponsesTable.userId, userWithRoles.id),
        includeFailed ? undefined : eq(aiResponsesTable.failed, false)
      ),
      orderBy: buildOrderBy(aiResponsesTable, orderBy, order),
      offset: (page - 1) * limit,
      limit
    });

    return OkResponse({
      entities: aiResponses,
      page,
      perPage: limit
    });
  } catch (error) {
    console.error('Error getting AI responses:', error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
