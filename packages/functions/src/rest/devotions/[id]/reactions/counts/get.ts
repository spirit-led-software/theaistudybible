import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse
} from '@lib/api-responses';
import { getDevotion } from '@services/devotion';
import { getDevotionReactionCounts } from '@services/devotion/reaction';
import { ApiHandler } from 'sst/node/api';

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;

  try {
    const devotion = await getDevotion(id);
    if (!devotion) {
      return ObjectNotFoundResponse(id);
    }

    const devoReactionCounts = await getDevotionReactionCounts(id);

    return OkResponse(devoReactionCounts);
  } catch (err) {
    console.error(`Error getting reaction counts for devotion '${id}':`, err);
    if (err instanceof Error) {
      return InternalServerErrorResponse(`${err.message}\n${err.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(err));
    }
  }
});
