import { getUserGeneratedImage } from '@revelationsai/server/services/generated-image/generated-image';
import { validApiHandlerSession } from '@revelationsai/server/services/session';
import { isObjectOwner } from '@revelationsai/server/services/user';
import { ApiHandler } from 'sst/node/api';
import {
  ObjectNotFoundResponse,
  UnauthorizedResponse,
  OkResponse,
  InternalServerErrorResponse
} from '../../../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;

  try {
    const image = await getUserGeneratedImage(id);
    if (!image) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid || !isObjectOwner(image, userWithRoles.id)) {
      return UnauthorizedResponse('You are not authorized to view this image');
    }

    return OkResponse(image);
  } catch (error) {
    console.error(`Error getting user generated image '${id}':`, error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
