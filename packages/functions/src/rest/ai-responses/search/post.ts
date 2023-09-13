import { buildOrderBy, buildQuery } from "@core/database/helpers";
import { aiResponses } from "@core/schema";
import {
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { getAiResponses } from "@services/ai-response";
import { validApiHandlerSession } from "@services/session";
import { and, eq } from "drizzle-orm";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const searchParams = event.queryStringParameters ?? {};
  const limit = parseInt(searchParams.limit ?? "25");
  const page = parseInt(searchParams.page ?? "1");
  const orderBy = searchParams.orderBy ?? "createdAt";
  const order = searchParams.order ?? "desc";
  const query = JSON.parse(event.body ?? "{}");

  console.log("Received AI response search request: ", {
    query: JSON.stringify(query),
    limit,
    page,
    orderBy,
    order,
  });

  try {
    const { isValid, userAndRoles: userInfo } = await validApiHandlerSession();
    if (!isValid) {
      return UnauthorizedResponse("You must be logged in");
    }

    const responses = await getAiResponses({
      where: and(
        buildQuery(aiResponses, query),
        eq(aiResponses.userId, userInfo.id)
      ),
      limit,
      offset: (page - 1) * limit,
      orderBy: buildOrderBy(aiResponses, orderBy, order),
    });

    return OkResponse({
      entities: responses,
      page,
      perPage: limit,
    });
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
