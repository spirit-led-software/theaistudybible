import { getChat, updateChat } from "@core/services/chat";
import { Chat } from "@revelationsai/core/database/model";

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
  const data = JSON.parse(event.body ?? "{}");

  try {
    let chat: Chat | undefined = await getChat(id);
    if (!chat) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userInfo } = await validApiSession();
    if (!isValid || !isObjectOwner(chat, userInfo.id)) {
      return UnauthorizedResponse("You are not authorized to edit this chat");
    }

    chat = await updateChat(chat!.id, data);

    return OkResponse(chat);
  } catch (error: any) {
    return InternalServerErrorResponse(error.stack);
  }
});
