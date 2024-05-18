import { buildOrderBy } from '@revelationsai/core/database/helpers';
import { aiResponseReactions } from '@revelationsai/core/database/schema';
import { getAiResponse } from '@revelationsai/server/services/ai-response';
import { getAiResponseReactions } from '@revelationsai/server/services/ai-response/reaction';
import { validApiHandlerSession } from '@revelationsai/server/services/session';
import { isObjectOwner } from '@revelationsai/server/services/user';
import { eq } from 'drizzle-orm';
import { ApiHandler } from 'sst/node/api';
import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse
} from '../../../../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  const searchParams = event.queryStringParameters ?? {};
  const limit = parseInt(searchParams.limit ?? '25');
  const page = parseInt(searchParams.page ?? '1');
  const orderBy = searchParams.orderBy ?? 'createdAt';
  const order = searchParams.order ?? 'desc';

  try {
    const aiResponse = await getAiResponse(id);
    if (!aiResponse) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid) {
      return UnauthorizedResponse('You must be signed in.');
    }

    if (!isObjectOwner(aiResponse, userWithRoles.id)) {
      return UnauthorizedResponse('You do not have permission to view these reactions.');
    }

    const reactions = await getAiResponseReactions({
      where: eq(aiResponseReactions.aiResponseId, aiResponse.id),
      limit,
      offset: (page - 1) * limit,
      orderBy: buildOrderBy(aiResponseReactions, orderBy, order)
    });

    return OkResponse({
      entities: reactions,
      page,
      perPage: limit
    });
  } catch (err) {
    console.error(`Error getting reactions for ai response '${id}':`, err);
    if (err instanceof Error) {
      return InternalServerErrorResponse(`${err.message}\n${err.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(err));
    }
  }
});
