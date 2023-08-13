import { users as usersTable } from "@core/schema";
import { InternalServerErrorResponse, OkResponse } from "@lib/api-responses";
import { buildOrderBy } from "@revelationsai/core/database/helpers";
import { getUsers } from "@services/user";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const searchParams = event.queryStringParameters ?? {};
  const limit = parseInt(searchParams.limit ?? "25");
  const page = parseInt(searchParams.page ?? "1");
  const orderBy = searchParams.orderBy ?? "createdAt";
  const order = searchParams.order ?? "desc";

  try {
    const users = await getUsers({
      limit,
      offset: (page - 1) * limit,
      orderBy: buildOrderBy(usersTable, orderBy, order),
    });

    return OkResponse({
      entities: users,
      page,
      perPage: limit,
    });
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
