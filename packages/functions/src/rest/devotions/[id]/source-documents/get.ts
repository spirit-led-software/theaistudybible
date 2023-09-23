import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
} from "@lib/api-responses";
import { getDevotion, getDevotionSourceDocuments } from "@services/devotion";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;

  try {
    const devotion = await getDevotion(id);
    if (!devotion) {
      return ObjectNotFoundResponse(id);
    }

    const sourceDocuments = await getDevotionSourceDocuments(devotion);

    return OkResponse(
      sourceDocuments.map((sourceDocument) => {
        const { embedding, ...rest } = sourceDocument;
        return rest;
      })
    );
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
