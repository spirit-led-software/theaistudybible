import {
  DeletedResponse,
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { deleteChat, getChat } from "@services/chat/chat";
import { validApiHandlerSession } from "@services/session";
import { isObjectOwner } from "@services/user";
import { deleteChatMemoryVectorStore } from "@services/vector-db";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  try {
    const chat = await getChat(id);
    if (!chat) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid || !isObjectOwner(chat, userWithRoles.id)) {
      return UnauthorizedResponse("You are not authorized to delete this chat");
    }

    await deleteChat(chat.id);
    await deleteChatMemoryVectorStore(chat.id);

    return DeletedResponse(chat.id);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
