import { getDevotion } from "@core/services/devotion";
import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
} from "@lib/api-responses";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;

  try {
    const devo = await getDevotion(id);
    if (!devo) {
      return ObjectNotFoundResponse(id);
    }

    return OkResponse(devo);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
