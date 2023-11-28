import { aiResponseReactions } from "@core/schema";
import {
  BadRequestResponse,
  CreatedResponse,
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import {
  createAiResponseReaction,
  getAiResponse,
  getAiResponseReactions,
  updateAiResponseReaction,
} from "@services/ai-response";
import { validApiHandlerSession } from "@services/session";
import { and, eq } from "drizzle-orm";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  const data = JSON.parse(event.body ?? "{}");

  const { reaction, comment } = data;
  if (!reaction) {
    return BadRequestResponse("Missing required parameter: reaction");
  }

  if (!aiResponseReactions.reaction.enumValues.includes(reaction)) {
    return BadRequestResponse(
      `Invalid reaction: ${reaction}. Must be one of ${aiResponseReactions.reaction.enumValues.join(
        ", "
      )}`
    );
  }

  try {
    let aiResponse = await getAiResponse(id);
    if (!aiResponse) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid) {
      return UnauthorizedResponse("You must be signed in.");
    }

    let aiResponseReaction = (
      await getAiResponseReactions({
        where: and(
          eq(aiResponseReactions.aiResponseId, aiResponse.id),
          eq(aiResponseReactions.userId, userWithRoles.id)
        ),
        limit: 1,
      })
    ).at(0);

    if (aiResponseReaction) {
      if (aiResponseReaction.reaction === reaction) {
        return BadRequestResponse(
          "You have already reacted with this reaction."
        );
      } else {
        aiResponseReaction.reaction = reaction;
        aiResponseReaction = await updateAiResponseReaction(aiResponseReaction.id, {
          reaction,
          comment,
        });
        return OkResponse(aiResponseReaction);
      }
    }

    aiResponseReaction = await createAiResponseReaction({
      aiResponseId: aiResponse.id,
      userId: userWithRoles.id,
      reaction,
      comment,
    });
    return CreatedResponse(aiResponseReaction);
  } catch (err: any) {
    console.error(err);
    return InternalServerErrorResponse(err.stack);
  }
});
