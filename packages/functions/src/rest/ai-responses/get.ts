import { getAiResponses } from "@core/services/ai-response";
import { validApiSession } from "@core/services/session";
import {
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { buildOrderBy } from "@revelationsai/core/database/helpers";
import { aiResponses as aiResponsesTable } from "@revelationsai/core/database/schema";
import { eq } from "drizzle-orm";
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
      return UnauthorizedResponse("You must be logged in");
    }

    const aiResponses = await getAiResponses({
      where: eq(aiResponsesTable.userId, userInfo.id),
      orderBy: buildOrderBy(aiResponsesTable, orderBy, order),
      offset: (page - 1) * limit,
      limit,
    });

    return OkResponse({
      entities: aiResponses,
      page,
      perPage: limit,
    });
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
