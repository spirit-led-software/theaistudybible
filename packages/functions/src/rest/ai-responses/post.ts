import { createAiResponse } from "@core/services/ai-response";
import { validApiSession } from "@core/services/session";
import {
  CreatedResponse,
  InternalServerErrorResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const data = JSON.parse(event.body ?? "{}");
  try {
    const { isValid, userInfo } = await validApiSession();
    if (!isValid) {
      return UnauthorizedResponse("You must be logged in");
    }
    const aiResponse = await createAiResponse({
      ...data,
      userId: userInfo.id,
    });

    return CreatedResponse(aiResponse);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
