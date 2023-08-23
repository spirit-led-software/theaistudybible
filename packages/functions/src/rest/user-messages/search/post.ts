import { buildOrderBy, buildQuery } from "@core/database/helpers";
import { userMessages } from "@core/schema";
import {
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { validApiHandlerSession } from "@services/session";
import { getUserMessages } from "@services/user/message";
import { and, eq } from "drizzle-orm";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const searchParams = event.queryStringParameters ?? {};
  const limit = parseInt(searchParams.limit ?? "25");
  const page = parseInt(searchParams.page ?? "1");
  const orderBy = searchParams.orderBy ?? "createdAt";
  const order = searchParams.order ?? "desc";
  const query = JSON.parse(event.body ?? "{}");

  console.log("Received user message search request: ", {
    query: JSON.stringify(query),
    limit,
    page,
    orderBy,
    order,
  });

  try {
    const { isValid, userInfo } = await validApiHandlerSession();
    if (!isValid) {
      return UnauthorizedResponse("You must be logged in");
    }

    const messages = await getUserMessages({
      where: and(
        buildQuery(userMessages, query),
        eq(userMessages.userId, userInfo.id)
      ),
      limit,
      offset: (page - 1) * limit,
      orderBy: buildOrderBy(userMessages, orderBy, order),
    });

    return OkResponse({
      entities: messages,
      page,
      perPage: limit,
    });
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
