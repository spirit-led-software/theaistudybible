import { chats as chatsTable } from "@core/schema";
import {
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { buildOrderBy } from "@revelationsai/core/database/helpers";
import { getChats } from "@services/chat";
import { validApiHandlerSession } from "@services/session";
import { eq } from "drizzle-orm";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const searchParams = event.queryStringParameters ?? {};
  const limit = parseInt(searchParams.limit ?? "25");
  const page = parseInt(searchParams.page ?? "1");
  const orderBy = searchParams.orderBy ?? "createdAt";
  const order = searchParams.order ?? "desc";

  try {
    const { isValid, userInfo } = await validApiHandlerSession();
    if (!isValid) {
      return UnauthorizedResponse("You are not logged in.");
    }

    const chats = await getChats({
      where: eq(chatsTable.userId, userInfo.id),
      orderBy: buildOrderBy(chatsTable, orderBy, order),
      offset: (page - 1) * limit,
      limit,
    });

    return OkResponse({
      entities: chats,
      page,
      perPage: limit,
    });
  } catch (error: any) {
    return InternalServerErrorResponse(error.stack);
  }
});
