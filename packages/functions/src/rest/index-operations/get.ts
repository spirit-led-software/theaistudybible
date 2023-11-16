import { buildOrderBy } from "@core/database/helpers";
import { indexOperations } from "@core/schema";
import {
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { getIndexOperations } from "@services/data-source/index-op";
import { validApiHandlerSession } from "@services/session";
import { isAdmin } from "@services/user";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const searchParams = event.queryStringParameters ?? {};
  const limit = parseInt(searchParams.limit ?? "25");
  const page = parseInt(searchParams.page ?? "1");
  const orderBy = searchParams.orderBy ?? "createdAt";
  const order = searchParams.order ?? "desc";

  try {
    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid || !(await isAdmin(userWithRoles.id))) {
      return UnauthorizedResponse();
    }

    const indexOps = await getIndexOperations({
      offset: (page - 1) * limit,
      limit,
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
