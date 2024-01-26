import { buildOrderBy } from '@revelationsai/core/database/helpers';
import { devotionReactions } from '@revelationsai/core/database/schema';
import type { DevotionReactionInfo } from '@revelationsai/core/model/devotion/reaction';
import { getDevotionReactionsWithInfo } from '@revelationsai/server/services/devotion/reaction';
import { validApiHandlerSession } from '@revelationsai/server/services/session';
import { isAdminSync } from '@revelationsai/server/services/user';
import { ApiHandler } from 'sst/node/api';
import {
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse
} from '../../../../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  const searchParams = event.queryStringParameters ?? {};
  const limit = parseInt(searchParams.limit ?? '25');
  const page = parseInt(searchParams.page ?? '1');
  const orderBy = searchParams.orderBy ?? 'createdAt';
  const order = searchParams.order ?? 'desc';

  try {
    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid) {
      return UnauthorizedResponse('You must be signed in.');
    }

    if (!isAdminSync(userWithRoles)) {
      return UnauthorizedResponse('You do not have permission to view these reactions.');
    }

    const reactions = await getDevotionReactionsWithInfo({
      limit,
      offset: (page - 1) * limit,
      orderBy: buildOrderBy(devotionReactions, orderBy, order)
    });

    return OkResponse({
      entities: reactions.map((reaction) => {
        return {
          ...reaction.devotion_reactions,
          user: reaction.users,
          devotion: reaction.devotions
        } satisfies DevotionReactionInfo;
      }),
      page,
      perPage: limit
    });
  } catch (err) {
    console.error('Error searching devotion reactions:', err);
    if (err instanceof Error) {
      return InternalServerErrorResponse(`${err.message}\n${err.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(err));
    }
  }
});
