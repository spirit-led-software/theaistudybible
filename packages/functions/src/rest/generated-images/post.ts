import { getTimeStringFromSeconds } from '@revelationsai/core/util/date';
import { generatedImage } from '@revelationsai/server/lib/user/generated-image';
import { validApiHandlerSession } from '@revelationsai/server/services/session';
import {
  decrementUserGeneratedImageCount,
  getUserGeneratedImageCountTtl,
  incrementUserGeneratedImageCount
} from '@revelationsai/server/services/user/image-count';
import { ApiHandler } from 'sst/node/api';
import 'web-streams-polyfill/dist/polyfill.es2018.js';
import {
  BadRequestResponse,
  CreatedResponse,
  InternalServerErrorResponse,
  TooManyRequestsResponse,
  UnauthorizedResponse
} from '../../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  const payload = JSON.parse(event.body ?? '{}');

  const { prompt } = payload;

  if (!prompt) {
    return BadRequestResponse('You must provide a prompt');
  }

  try {
    const { isValid, userWithRoles, remainingGeneratedImages } = await validApiHandlerSession();
    if (!isValid) {
      return UnauthorizedResponse('You must be logged in');
    }

    if (remainingGeneratedImages <= 0) {
      const ttl = await getUserGeneratedImageCountTtl(userWithRoles.id);
      return TooManyRequestsResponse(
        `You have issued too many requests. Please wait ${getTimeStringFromSeconds(ttl)} before trying again.`
      );
    }

    const incrementUserGeneratedImageCountPromise = incrementUserGeneratedImageCount(
      userWithRoles.id
    );
    const image = await generatedImage(userWithRoles, prompt).catch(async (error) => {
      await incrementUserGeneratedImageCountPromise.then(() => {
        decrementUserGeneratedImageCount(userWithRoles.id);
      });
      throw error;
    });
    return CreatedResponse(image);
  } catch (error) {
    console.error('Error creating generated image:', error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
