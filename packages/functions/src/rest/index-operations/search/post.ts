import { indexOperations } from "@core/schema";
import {
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { buildOrderBy, buildQuery } from "@revelationsai/core/database/helpers";
import { getIndexOperations } from "@services/index-op";
import { validApiHandlerSession } from "@services/session";
import { isAdmin } from "@services/user";
import { and } from "drizzle-orm";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const searchParams = event.queryStringParameters ?? {};
  const limit = parseInt(searchParams.limit ?? "25");
  const page = parseInt(searchParams.page ?? "1");
  const orderBy = searchParams.orderBy ?? "createdAt";
  const order = searchParams.order ?? "desc";
  const query = JSON.parse(event.body ?? "{}");

  console.log("Received index operations search request: ", {
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

    if (!(await isAdmin(userInfo.id))) {
      return UnauthorizedResponse("You must be an admin");
    }

    const indexOps = await getIndexOperations({
      where: and(buildQuery(indexOperations, query)),
      limit,
      offset: (page - 1) * limit,
      orderBy: buildOrderBy(indexOperations, orderBy, order),
    });

    return OkResponse({
      entities: indexOps,
      page,
      perPage: limit,
    });
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
