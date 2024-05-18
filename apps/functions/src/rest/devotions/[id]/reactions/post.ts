import { devotionReactions } from '@revelationsai/core/database/schema';
import { getDevotion } from '@revelationsai/server/services/devotion';
import {
  createDevotionReaction,
  getDevotionReactions,
  updateDevotionReaction
} from '@revelationsai/server/services/devotion/reaction';
import { validApiHandlerSession } from '@revelationsai/server/services/session';
import { and, eq } from 'drizzle-orm';
import { ApiHandler } from 'sst/node/api';
import {
  BadRequestResponse,
  ObjectNotFoundResponse,
  UnauthorizedResponse,
  OkResponse,
  CreatedResponse,
  InternalServerErrorResponse
} from '../../../../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  const data = JSON.parse(event.body ?? '{}');

  const { reaction, comment } = data;
  if (!reaction) {
    return BadRequestResponse('Missing required parameter: reaction');
  }

  if (!devotionReactions.reaction.enumValues.includes(reaction)) {
    return BadRequestResponse(
      `Invalid reaction: ${reaction}. Must be one of ${devotionReactions.reaction.enumValues.join(
        ', '
      )}`
    );
  }

  try {
    const devotion = await getDevotion(id);
    if (!devotion) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid) {
      return UnauthorizedResponse('You must be signed in.');
    }

    let devoReaction = (
      await getDevotionReactions({
        where: and(
          eq(devotionReactions.devotionId, devotion.id),
          eq(devotionReactions.userId, userWithRoles.id)
        ),
        limit: 1
      })
    ).at(0);

    if (devoReaction) {
      if (devoReaction.reaction === reaction) {
        return BadRequestResponse('You have already reacted with this reaction.');
      } else {
        devoReaction.reaction = reaction;
        devoReaction = await updateDevotionReaction(devoReaction.id, {
          reaction,
          comment
        });
        return OkResponse(devoReaction);
      }
    }

    devoReaction = await createDevotionReaction({
      devotionId: devotion.id,
      userId: userWithRoles.id,
      reaction,
      comment
    });
    return CreatedResponse(devoReaction);
  } catch (err) {
    console.error(`Error reacting to devotion '${id}':`, err);
    if (err instanceof Error) {
      return InternalServerErrorResponse(`${err.message}\n${err.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(err));
    }
  }
});
