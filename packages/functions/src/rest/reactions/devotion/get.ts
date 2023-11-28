import { buildOrderBy } from "@core/database/helpers";
import type { DevotionReactionInfo } from "@core/model";
import { devotionReactions } from "@core/schema";
import {
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { getDevotionReactionsWithInfo } from "@services/devotion";
import { validApiHandlerSession } from "@services/session";
import { isAdminSync } from "@services/user";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const searchParams = event.queryStringParameters ?? {};
  const limit = parseInt(searchParams.limit ?? "25");
  const page = parseInt(searchParams.page ?? "1");
  const orderBy = searchParams.orderBy ?? "createdAt";
  const order = searchParams.order ?? "desc";

  try {
    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid) {
      return UnauthorizedResponse("You must be signed in.");
    }

    if (!isAdminSync(userWithRoles)) {
      return UnauthorizedResponse(
        "You do not have permission to view these reactions."
      );
    }

    const reactions = await getDevotionReactionsWithInfo({
      limit,
      offset: (page - 1) * limit,
      orderBy: buildOrderBy(devotionReactions, orderBy, order),
    });

    return OkResponse({
      entities: reactions.map(
        (reaction) =>
          ({
            ...reaction.devotion_reactions,
            user: reaction.users,
            devotion: reaction.devotions,
          }) satisfies DevotionReactionInfo
      ),
      page,
      perPage: limit,
    });
  } catch (err: any) {
    console.error(err);
    return InternalServerErrorResponse(err.stack);
  }
});
