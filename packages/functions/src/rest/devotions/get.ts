import { getDevotions } from "@core/services/devotion";
import { InternalServerErrorResponse, OkResponse } from "@lib/api-responses";
import { buildOrderBy } from "@revelationsai/core/database/helpers";
import { devotions } from "@revelationsai/core/database/schema";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const searchParams = event.queryStringParameters ?? {};
  const limit = parseInt(searchParams.limit ?? "25");
  const page = parseInt(searchParams.page ?? "1");
  const orderBy = searchParams.orderBy ?? "createdAt";
  const order = searchParams.order ?? "desc";

  try {
    const devos = await getDevotions({
      orderBy: buildOrderBy(devotions, orderBy, order),
      offset: (page - 1) * limit,
      limit,
    });

    return OkResponse({
      entities: devos,
      page,
      perPage: limit,
    });
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
