import { buildOrderBy } from "@core/database/helpers";
import { devotionImages } from "@core/schema";
import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
} from "@lib/api-responses";
import { getDevotion, getDevotionImages } from "@services/devotion";
import { eq } from "drizzle-orm";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  const searchParams = event.queryStringParameters ?? {};
  const limit = parseInt(searchParams.limit ?? "25");
  const page = parseInt(searchParams.page ?? "1");
  const orderBy = searchParams.orderBy ?? "createdAt";
  const order = searchParams.order ?? "desc";

  try {
    let devotion = await getDevotion(id);
    if (!devotion) {
      return ObjectNotFoundResponse(id);
    }

    const devoImages = await getDevotionImages({
      where: eq(devotionImages.devotionId, devotion.id),
      limit,
      offset: (page - 1) * limit,
      orderBy: buildOrderBy(devotionImages, orderBy, order),
    });

    return OkResponse({
      entities: devoImages,
      page,
      perPage: limit,
    });
  } catch (err: any) {
    console.error(err);
    return InternalServerErrorResponse(err.stack);
  }
});