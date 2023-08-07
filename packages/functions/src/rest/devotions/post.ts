import { generateDevotion } from "@core/services/devotion";
import { validApiSession } from "@core/services/session";
import { isAdmin } from "@core/services/user";
import {
  CreatedResponse,
  InternalServerErrorResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const data = JSON.parse(event.body ?? "{}");
  const { bibleVerse } = data;

  try {
    const { isValid, userInfo } = await validApiSession();
    if (!isValid || !(await isAdmin(userInfo.id))) {
      return UnauthorizedResponse();
    }

    const devo = await generateDevotion(bibleVerse);

    return CreatedResponse(devo);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
