import { buildOrderBy } from "@core/database/helpers";
import type { AiResponseReactionInfo } from "@core/model";
import { aiResponseReactions } from "@core/schema";
import {
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { getAiResponseReactionsWithInfo } from "@services/ai-response";
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

    const reactions = await getAiResponseReactionsWithInfo({
      limit,
      offset: (page - 1) * limit,
      orderBy: buildOrderBy(aiResponseReactions, orderBy, order),
    });

    return OkResponse({
      entities: reactions.map(
        (reaction) =>
          ({
            ...reaction.ai_response_reactions,
            user: reaction.users,
            response: reaction.ai_responses,
          }) satisfies AiResponseReactionInfo
      ),
      page,
      perPage: limit,
    });
  } catch (err: any) {
    console.error(err);
    return InternalServerErrorResponse(err.stack);
  }
});
