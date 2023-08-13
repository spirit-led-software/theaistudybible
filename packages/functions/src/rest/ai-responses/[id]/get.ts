import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { getAiResponse } from "@services/ai-response";
import { validApiHandlerSession } from "@services/session";
import { isObjectOwner } from "@services/user";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  try {
    const aiResponse = await getAiResponse(id);
    if (!aiResponse) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userInfo } = await validApiHandlerSession();
    if (!isValid || !isObjectOwner(aiResponse, userInfo.id)) {
      return UnauthorizedResponse(
        "You are not authorized to view this response"
      );
    }

    return OkResponse(aiResponse);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
