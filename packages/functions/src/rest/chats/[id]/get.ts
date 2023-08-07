import { getChat } from "@core/services/chat";
import { validApiSession } from "@core/services/session";
import { isObjectOwner } from "@core/services/user";

import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;

  try {
    const chat = await getChat(id);
    if (!chat) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userInfo } = await validApiSession();
    if (!isValid || !isObjectOwner(chat, userInfo.id)) {
      return UnauthorizedResponse("You are not authorized to view this chat");
    }

    return OkResponse(chat);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
