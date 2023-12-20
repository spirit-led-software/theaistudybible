import { buildOrderBy } from '@core/database/helpers';
import { devotionReactions } from '@core/schema';
import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse
} from '@lib/api-responses';
import { getDevotion } from '@services/devotion';
import { getDevotionReactions } from '@services/devotion/reaction';
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
    const devotion = await getDevotion(id);
    if (!devotion) {
      return ObjectNotFoundResponse(id);
    }

    const devoReactions = await getDevotionReactions({
      where: eq(devotionReactions.devotionId, devotion.id),
      limit,
      offset: (page - 1) * limit,
      orderBy: buildOrderBy(devotionReactions, orderBy, order)
    });

    return OkResponse({
      entities: devoReactions,
      page,
      perPage: limit
    });
  } catch (err) {
    console.error(`Error getting reactions for devotion '${id}':`, err);
    if (err instanceof Error) {
      return InternalServerErrorResponse(`${err.message}\n${err.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(err));
    }
  }
});
