import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { getUserGeneratedImage } from "@services/generated-image/generated-image";
import { validApiHandlerSession } from "@services/session";
import { isObjectOwner } from "@services/user";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;

  try {
    const image = await getUserGeneratedImage(id);
    if (!image) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid || !isObjectOwner(image, userWithRoles.id)) {
      return UnauthorizedResponse("You are not authorized to view this image");
    }

    return OkResponse(image);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
