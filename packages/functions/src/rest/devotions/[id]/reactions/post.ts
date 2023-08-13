import { devotionReactions } from "@core/schema";
import {
  BadRequestResponse,
  CreatedResponse,
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import {
  createDevotionReaction,
  getDevotion,
  getDevotionReactions,
  updateDevotionReaction,
} from "@services/devotion";
import { validApiHandlerSession } from "@services/session";
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

    const { isValid, userInfo } = await validApiHandlerSession();
    if (!isValid) {
      return UnauthorizedResponse("You must be signed in.");
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
        return BadRequestResponse(
          "You have already reacted with this reaction."
        );
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
