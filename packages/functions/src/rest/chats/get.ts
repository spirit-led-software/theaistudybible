import { getChats } from "@core/services/chat";
import { validApiSession } from "@core/services/session";
import { isObjectOwner } from "@core/services/user";
import {
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { buildOrderBy } from "@revelationsai/core/database/helpers";
import { chats as chatsTable } from "@revelationsai/core/database/schema";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const searchParams = event.queryStringParameters ?? {};
  const limit = parseInt(searchParams.limit ?? "25");
  const page = parseInt(searchParams.page ?? "1");
  const orderBy = searchParams.orderBy ?? "createdAt";
  const order = searchParams.order ?? "desc";

  try {
    const { isValid, userInfo } = await validApiSession();
    if (!isValid) {
      return UnauthorizedResponse("You are not logged in.");
    }

    const chats = await getChats({
      orderBy: buildOrderBy(chatsTable, orderBy, order),
      offset: (page - 1) * limit,
      limit,
    })
      .then((chats) => {
        return chats.filter((chat) => isObjectOwner(chat, userInfo.id));
      })
      .catch((error) => {
        throw new Error(error);
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
