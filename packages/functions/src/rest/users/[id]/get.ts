import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
} from "@lib/api-responses";
import { getUser } from "@services/user";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  try {
    const user = await getUser(id);
    if (!user) {
      return ObjectNotFoundResponse(id);
    }

    return OkResponse(user);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
