import { buildOrderBy, buildQuery } from "@core/database/helpers";
import { dataSources as dataSourcesTable } from "@core/schema";
import {
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { getDataSources } from "@services/data-source";
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

  console.log("Received data source search request: ", {
    query: JSON.stringify(query),
    limit,
    page,
    orderBy,
    order,
  });

  try {
    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid) {
      return UnauthorizedResponse("You must be logged in");
    }

    if (!(await isAdmin(userWithRoles.id))) {
      return UnauthorizedResponse("You must be an admin");
    }

    const dataSources = await getDataSources({
      where: and(buildQuery(dataSourcesTable, query)),
      limit,
      offset: (page - 1) * limit,
      orderBy: buildOrderBy(dataSourcesTable, orderBy, order),
    });

    return OkResponse({
      entities: dataSources,
      page,
      perPage: limit,
    });
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
