import { UpdateUserData } from "@core/model";
import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { validApiHandlerSession } from "@services/session";
import { getUser, updateUser } from "@services/user";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  const data: UpdateUserData = JSON.parse(event.body ?? "{}");

  try {
    let user = await getUser(id);
    if (!user) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userInfo } = await validApiHandlerSession();
    if (!isValid || user.id !== userInfo.id) {
      return UnauthorizedResponse("You are not authorized to update this user");
    }

    if (data.maxDailyQueryCount) {
      return UnauthorizedResponse(
        "You are not authorized to update this field"
      );
    }

    user = await updateUser(user.id, data);

    return OkResponse(user);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
