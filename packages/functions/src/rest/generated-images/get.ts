import { buildOrderBy } from "@core/database/helpers";
import { userGeneratedImages } from "@core/schema";
import {
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { getUserGeneratedImages } from "@services/generated-image/generated-image";
import { validApiHandlerSession } from "@services/session";
import { and, eq } from "drizzle-orm";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const searchParams = event.queryStringParameters ?? {};
  const limit = parseInt(searchParams.limit ?? "25");
  const page = parseInt(searchParams.page ?? "1");
  const orderBy = searchParams.orderBy ?? "createdAt";
  const order = searchParams.order ?? "desc";
  const includeFailed = searchParams.includeFailed === "true";

  try {
    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid) {
      return UnauthorizedResponse("You are not logged in.");
    }

    const images = await getUserGeneratedImages({
      where: and(
        eq(userGeneratedImages.userId, userWithRoles.id),
        includeFailed ? undefined : eq(userGeneratedImages.failed, false)
      ),
      orderBy: buildOrderBy(userGeneratedImages, orderBy, order),
      offset: (page - 1) * limit,
      limit,
    });

    return OkResponse({
      entities: images,
      page,
      perPage: limit,
    });
  } catch (error: any) {
    return InternalServerErrorResponse(error.stack);
  }
});
