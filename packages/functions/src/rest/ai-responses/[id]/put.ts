import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { getAiResponse, updateAiResponse } from "@services/ai-response";
import { validApiHandlerSession } from "@services/session";
import { isObjectOwner } from "@services/user";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  const data = JSON.parse(event.body ?? "{}");

  try {
    let aiResponse = await getAiResponse(id);
    if (!aiResponse) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userAndRoles: userInfo } = await validApiHandlerSession();
    if (!isValid || !isObjectOwner(aiResponse, userInfo.id)) {
      return UnauthorizedResponse(
        "You are not authorized to update this response"
      );
    }

    aiResponse = await updateAiResponse(aiResponse.id, data);

    return OkResponse(aiResponse);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
