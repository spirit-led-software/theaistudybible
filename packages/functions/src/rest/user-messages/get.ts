import { validApiSession } from "@core/services/session";
import { isObjectOwner } from "@core/services/user";
import { getUserMessages } from "@core/services/user-message";
import {
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { buildOrderBy } from "@revelationsai/core/database/helpers";
import { userMessages } from "@revelationsai/core/database/schema";
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
      return UnauthorizedResponse("You must be logged in.");
    }

    let messages = await getUserMessages({
      limit,
      offset: (page - 1) * limit,
      orderBy: buildOrderBy(userMessages, orderBy, order),
    });

    messages = messages.filter((message) => {
      return isObjectOwner(message, userInfo.id);
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
