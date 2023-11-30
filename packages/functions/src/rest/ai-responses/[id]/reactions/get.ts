import { buildOrderBy } from '@core/database/helpers';
import { aiResponseReactions } from '@core/schema';
import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse
} from '@lib/api-responses';
import { getAiResponse, getAiResponseReactions } from '@services/ai-response';
import { validApiHandlerSession } from '@services/session';
import { isObjectOwner } from '@services/user';
import { eq } from 'drizzle-orm';
import { ApiHandler } from 'sst/node/api';

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
