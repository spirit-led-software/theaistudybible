import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { validApiHandlerSession } from "@services/session";
import { isObjectOwner } from "@services/user";
import { getUserMessage } from "@services/user/message";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  try {
    const userMessage = await getUserMessage(id);
    if (!userMessage) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userAndRoles: userInfo } = await validApiHandlerSession();
    if (!isValid || !isObjectOwner(userMessage, userInfo.id)) {
      return UnauthorizedResponse(
        "You are not authorized to view this message"
      );
    }

    return OkResponse(userMessage);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
