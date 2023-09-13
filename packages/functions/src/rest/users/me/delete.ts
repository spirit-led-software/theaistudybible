import {
  DeletedResponse,
  InternalServerErrorResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { validApiHandlerSession } from "@services/session";
import { deleteUser } from "@services/user";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  try {
    const { isValid, userAndRoles: userInfo } = await validApiHandlerSession();
    if (!isValid) {
      return UnauthorizedResponse();
    }

    await deleteUser(userInfo.id);
    return DeletedResponse(userInfo.id);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
