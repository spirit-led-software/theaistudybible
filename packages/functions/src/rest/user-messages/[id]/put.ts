import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { validApiHandlerSession } from "@services/session";
import { isObjectOwner } from "@services/user";
import { getUserMessage, updateUserMessage } from "@services/user/message";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  const data = JSON.parse(event.body ?? "{}");

  try {
    let userMessage = await getUserMessage(id);
    if (!userMessage) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userInfo } = await validApiHandlerSession();
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
