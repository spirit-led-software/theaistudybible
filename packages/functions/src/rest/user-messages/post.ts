import {
  CreatedResponse,
  InternalServerErrorResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { validApiHandlerSession } from "@services/session";
import { createUserMessage } from "@services/user/message";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const data = JSON.parse(event.body ?? "{}");

  try {
    const { isValid, userAndRoles: userInfo } = await validApiHandlerSession();
    if (!isValid) {
      return UnauthorizedResponse("You must be logged in.");
    }

    const message = await createUserMessage({
      ...data,
      userId: userInfo.id,
    });

    return CreatedResponse(message);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
