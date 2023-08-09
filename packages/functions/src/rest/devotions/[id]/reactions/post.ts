import {
  createDevotionReaction,
  getDevotion,
  getDevotionReactions,
  updateDevotionReaction,
} from "@core/services/devotion";
import { validApiSession } from "@core/services/session";
import {
  BadRequestResponse,
  CreatedResponse,
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { devotionReactions } from "@revelationsai/core/database/schema";
import { and, eq } from "drizzle-orm";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  const data = JSON.parse(event.body ?? "{}");

  const { reaction } = data;
  if (!reaction) {
    return BadRequestResponse("Missing required parameter: reaction");
  }

  if (!devotionReactions.reaction.enumValues.includes(reaction)) {
    return BadRequestResponse(
      `Invalid reaction: ${reaction}. Must be one of ${devotionReactions.reaction.enumValues.join(
        ", "
      )}`
    );
  }

  try {
    let devotion = await getDevotion(id);
    if (!devotion) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userInfo } = await validApiSession();
    if (!isValid) {
      return UnauthorizedResponse("You must be signed in!");
    }

    let devoReaction = (
      await getDevotionReactions({
        where: and(
          eq(devotionReactions.devotionId, devotion.id),
          eq(devotionReactions.userId, userInfo.id)
        ),
        limit: 1,
      })
    ).at(0);

    if (devoReaction) {
      if (devoReaction.reaction === reaction) {
        return OkResponse(devoReaction);
      } else {
        devoReaction.reaction = reaction;
        devoReaction = await updateDevotionReaction(devoReaction.id, {
          reaction,
        });
        return OkResponse(devoReaction);
      }
    }

    devoReaction = await createDevotionReaction({
      devotionId: devotion.id,
      userId: userInfo.id,
      reaction,
    });
    return CreatedResponse(devoReaction);
  } catch (err: any) {
    console.error(err);
    return InternalServerErrorResponse(err.stack);
  }
});
