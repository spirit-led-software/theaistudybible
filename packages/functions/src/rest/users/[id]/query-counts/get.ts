import { userQueryCounts } from "@core/schema";
import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { buildOrderBy } from "@revelationsai/core/database/helpers";
import { validApiHandlerSession } from "@services/session";
import { getUser, getUserQueryCountsByUserId } from "@services/user";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  const searchParams = event.queryStringParameters ?? {};
  const limit = parseInt(searchParams.limit ?? "25");
  const page = parseInt(searchParams.page ?? "1");
  const orderBy = searchParams.orderBy ?? "createdAt";
  const order = searchParams.order ?? "desc";

  try {
    const user = await getUser(id);
    if (!user) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userInfo } = await validApiHandlerSession();
    if (!isValid || user.id !== userInfo.id) {
      return UnauthorizedResponse(
        "You are not authorized to view this user's query count."
      );
    }

    const queryCounts = await getUserQueryCountsByUserId(id, {
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
