import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
} from "@lib/api-responses";
import { getDevotion, getDevotionReactionCounts } from "@services/devotion";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;

  try {
    let devotion = await getDevotion(id);
    if (!devotion) {
      return ObjectNotFoundResponse(id);
    }

    const devoReactionCounts = await getDevotionReactionCounts(id);

    return OkResponse(devoReactionCounts);
  } catch (err: any) {
    console.error(err);
    return InternalServerErrorResponse(err.stack);
  }
});
