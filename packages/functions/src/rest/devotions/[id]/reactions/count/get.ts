import {
  getDevotion,
  getDevotionReactionCountByDevotionIdAndReactionType,
} from "@core/services/devotion";
import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
} from "@lib/api-responses";
import { devotionReactions } from "@revelationsai/core/database/schema";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;

  try {
    let devotion = await getDevotion(id);
    if (!devotion) {
      return ObjectNotFoundResponse(id);
    }

    let devoReactionCounts:
      | {
          [key in (typeof devotionReactions.reaction.enumValues)[number]]?: number;
        } = {};
    for (const reactionType of devotionReactions.reaction.enumValues) {
      const reactionCount =
        await getDevotionReactionCountByDevotionIdAndReactionType(
          devotion.id,
          reactionType
        );
      devoReactionCounts[reactionType] = reactionCount;
    }
    return OkResponse(devoReactionCounts);
  } catch (err: any) {
    console.error(err);
    return InternalServerErrorResponse(err.stack);
  }
});
