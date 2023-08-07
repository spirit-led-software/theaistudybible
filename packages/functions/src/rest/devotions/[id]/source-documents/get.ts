import {
  getDevotion,
  getDevotionRelatedSourceDocuments,
} from "@core/services/devotion";
import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
} from "@lib/api-responses";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;

  try {
    const devotion = await getDevotion(id);
    if (!devotion) {
      return ObjectNotFoundResponse(
        `Could not find AI response with ID ${id}.`
      );
    }

    const sourceDocuments = await getDevotionRelatedSourceDocuments(devotion);

    return OkResponse(sourceDocuments);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
