import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { getChat } from "@services/chat";
import { validApiHandlerSession } from "@services/session";
import { isObjectOwner } from "@services/user";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;

  try {
    const chat = await getChat(id);
    if (!chat) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userInfo } = await validApiHandlerSession();
    if (!isValid || !isObjectOwner(chat, userInfo.id)) {
      return UnauthorizedResponse("You are not authorized to view this chat");
    }

    return OkResponse(chat);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
