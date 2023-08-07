import { validApiSession } from "@core/services/session";
import { isObjectOwner } from "@core/services/user";
import { deleteUserMessage, getUserMessage } from "@core/services/user-message";
import {
  DeletedResponse,
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  try {
    const userMessage = await getUserMessage(id);
    if (!userMessage) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userInfo } = await validApiSession();
    if (!isValid || !isObjectOwner(userMessage, userInfo.id)) {
      return UnauthorizedResponse(
        "You are not authorized to delete this message"
      );
    }

    await deleteUserMessage(userMessage.id);
    return DeletedResponse(userMessage.id);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
