import { validApiSession } from "@core/services/session";
import { isObjectOwner } from "@core/services/user";
import { getUserMessage, updateUserMessage } from "@core/services/user-message";
import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  const data = JSON.parse(event.body ?? "{}");

  try {
    let userMessage = await getUserMessage(id);
    if (!userMessage) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userInfo } = await validApiSession();
    if (!isValid || !isObjectOwner(userMessage, userInfo.id)) {
      return UnauthorizedResponse(
        "You are not authorized to update this message"
      );
    }

    userMessage = await updateUserMessage(userMessage.id, data);

    return OkResponse(userMessage);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
