import { getAiResponses } from "@core/services/ai-response";
import { validApiSession } from "@core/services/session";
import { isAdmin, isObjectOwner } from "@core/services/user";
import {
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { buildOrderBy } from "@revelationsai/core/database/helpers";
import { aiResponses as aiResponsesTable } from "@revelationsai/core/database/schema";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const searchParams = event.queryStringParameters ?? {};
  const limit = parseInt(searchParams.limit ?? "25");
  const page = parseInt(searchParams.page ?? "1");
  const orderBy = searchParams.orderBy ?? "createdAt";
  const order = searchParams.order ?? "desc";

  try {
    let aiResponses = await getAiResponses({
      orderBy: buildOrderBy(aiResponsesTable, orderBy, order),
      offset: (page - 1) * limit,
      limit,
    });

    const { isValid, userInfo } = await validApiSession();
    if (!isValid) {
      return UnauthorizedResponse("You must be logged in");
    }

    aiResponses = aiResponses.filter(async (response) => {
      return (
        (await isAdmin(userInfo.id)) || isObjectOwner(response, userInfo.id)
      );
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
