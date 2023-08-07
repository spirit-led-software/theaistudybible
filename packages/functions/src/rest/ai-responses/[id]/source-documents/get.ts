import {
  getAiResponse,
  getAiResponseRelatedSourceDocuments,
} from "@core/services/ai-response";
import { validApiSession } from "@core/services/session";
import { isObjectOwner } from "@core/services/user";
import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  try {
    const aiResponse = await getAiResponse(id);
    if (!aiResponse) {
      return ObjectNotFoundResponse(
        `Could not find AI response with ID ${id}.`
      );
    }

    const { isValid, userInfo } = await validApiSession();
    if (!isValid || !isObjectOwner(aiResponse, userInfo.id)) {
      return UnauthorizedResponse(
        "You are not authorized to delete this response"
      );
    }

    const sourceDocuments = await getAiResponseRelatedSourceDocuments(
      aiResponse
    );

    return OkResponse(sourceDocuments);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
