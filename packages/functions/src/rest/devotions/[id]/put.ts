import { getDevotion, updateDevotion } from "@core/services/devotion";
import { validApiSession } from "@core/services/session";
import { isAdmin } from "@core/services/user";
import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { Devotion } from "@revelationsai/core/database/model";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  const data = JSON.parse(event.body ?? "{}");

  try {
    let devo: Devotion | undefined = await getDevotion(id);
    if (!devo) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userInfo } = await validApiSession();
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
