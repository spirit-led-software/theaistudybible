import { UpdateUserData } from "@core/model";
import {
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { validApiHandlerSession } from "@services/session";
import { updateUser } from "@services/user";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const data: UpdateUserData = JSON.parse(event.body ?? "{}");

  try {
    const { isValid, userInfo } = await validApiHandlerSession();
    if (!isValid) {
      return UnauthorizedResponse("You are not logged in.");
    }

    if (data.maxQueryCount) {
      return UnauthorizedResponse(
        "You are not authorized to update this field"
      );
    }

    const user = await updateUser(userInfo.id, data);

    return OkResponse(user);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
