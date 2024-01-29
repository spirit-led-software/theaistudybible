import { validApiHandlerSession } from '@revelationsai/server/services/session';
import { isObjectOwner } from '@revelationsai/server/services/user';
import {
  deleteUserGeneratedImage,
  getUserGeneratedImage
} from '@revelationsai/server/services/user/generated-image';
import { ApiHandler } from 'sst/node/api';
import {
  DeletedResponse,
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  UnauthorizedResponse
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
      return UnauthorizedResponse('You are not authorized to delete this image');
    }

    await deleteUserGeneratedImage(image.id);
    return DeletedResponse(image.id);
  } catch (error) {
    console.error(`Error deleting user generated image '${id}':`, error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
