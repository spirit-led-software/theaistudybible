import { Devotion } from "@core/model";
import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { getDevotion, updateDevotion } from "@services/devotion";
import { validApiHandlerSession } from "@services/session";
import { isAdmin } from "@services/user";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  const data = JSON.parse(event.body ?? "{}");

  try {
    let devo: Devotion | undefined = await getDevotion(id);
    if (!devo) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userInfo } = await validApiHandlerSession();
    if (!isValid || !(await isAdmin(userInfo.id))) {
      return UnauthorizedResponse();
    }

    devo = await updateDevotion(devo!.id, data);

    return OkResponse(devo);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
