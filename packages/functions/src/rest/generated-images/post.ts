import {
  BadRequestResponse,
  CreatedResponse,
  InternalServerErrorResponse,
  TooManyRequestsResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { generatedImage } from "@services/generated-image";
import { validApiHandlerSession } from "@services/session";
import {
  decrementUserGeneratedImageCount,
  incrementUserGeneratedImageCount,
} from "@services/user/image-count";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const payload = JSON.parse(event.body ?? "{}");

  const { prompt } = payload;

  if (!prompt) {
    return BadRequestResponse("You must provide a prompt");
  }

  try {
    const { isValid, userWithRoles, remainingGeneratedImages } =
      await validApiHandlerSession();
    if (!isValid) {
      return UnauthorizedResponse("You must be logged in");
    }

    if (remainingGeneratedImages < 1) {
      return TooManyRequestsResponse(
        "You have exceeded your daily allowed images. Please upgrade for more!"
      );
    }

    const incrementUserGeneratedImageCountPromise =
      incrementUserGeneratedImageCount(userWithRoles.id);
    const image = await generatedImage(userWithRoles, prompt).catch(
      async (error) => {
        await incrementUserGeneratedImageCountPromise.then(() => {
          decrementUserGeneratedImageCount(userWithRoles.id);
        });
        throw error;
      }
    );
    return CreatedResponse(image);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
