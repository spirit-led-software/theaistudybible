import { buildOrderBy } from "@core/database/helpers";
import { userQueryCounts } from "@core/schema";
import {
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { validApiHandlerSession } from "@services/session";
import { getUserQueryCountsByUserId } from "@services/user";
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
      return UnauthorizedResponse(
        "You are not logged in or your session has expired."
      );
    }

    const queryCounts = await getUserQueryCountsByUserId(userInfo.id, {
      limit,
      offset: (page - 1) * limit,
      orderBy: buildOrderBy(userQueryCounts, orderBy, order),
    });

    return OkResponse({
      entities: queryCounts,
      page,
      perPage: limit,
    });
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
