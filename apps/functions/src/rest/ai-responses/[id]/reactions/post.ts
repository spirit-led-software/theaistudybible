import { aiResponseReactions } from '@revelationsai/core/database/schema';
import { getAiResponse } from '@revelationsai/server/services/ai-response';
import {
  createAiResponseReaction,
  getAiResponseReactions,
  updateAiResponseReaction
} from '@revelationsai/server/services/ai-response/reaction';
import { validApiHandlerSession } from '@revelationsai/server/services/session';
import { isObjectOwner } from '@revelationsai/server/services/user';
import { and, eq } from 'drizzle-orm';
import { ApiHandler } from 'sst/node/api';
import {
  BadRequestResponse,
  CreatedResponse,
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse
} from '../../../../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  const data = JSON.parse(event.body ?? '{}');

  const { reaction, comment } = data;
  if (!reaction) {
    return BadRequestResponse('Missing required parameter: reaction');
  }

  if (!aiResponseReactions.reaction.enumValues.includes(reaction)) {
    return BadRequestResponse(
      `Invalid reaction: ${reaction}. Must be one of ${aiResponseReactions.reaction.enumValues.join(
        ', '
      )}`
    );
  }

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
      return UnauthorizedResponse('You do not have permission to react to this AI response.');
    }

    let aiResponseReaction = (
      await getAiResponseReactions({
        where: and(
          eq(aiResponseReactions.aiResponseId, aiResponse.id),
          eq(aiResponseReactions.userId, userWithRoles.id)
        ),
        limit: 1
      })
    ).at(0);

    if (aiResponseReaction) {
      if (aiResponseReaction.reaction === reaction) {
        return BadRequestResponse('You have already reacted with this reaction.');
      } else {
        aiResponseReaction.reaction = reaction;
        aiResponseReaction = await updateAiResponseReaction(aiResponseReaction.id, {
          reaction,
          comment
        });
        return OkResponse(aiResponseReaction);
      }
    }

    aiResponseReaction = await createAiResponseReaction({
      aiResponseId: aiResponse.id,
      userId: userWithRoles.id,
      reaction,
      comment
    });
    return CreatedResponse(aiResponseReaction);
  } catch (err) {
    console.error(`Error reacting to ai response '${id}':`, err);
    if (err instanceof Error) {
      return InternalServerErrorResponse(`${err.message}\n${err.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(err));
    }
  }
});
