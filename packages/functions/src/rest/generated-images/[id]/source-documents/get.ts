import { validApiHandlerSession } from '@revelationsai/server/services/session';
import { getSourceDocumentsByUserGeneratedImageId } from '@revelationsai/server/services/source-document';
import { isObjectOwner } from '@revelationsai/server/services/user';
import { getUserGeneratedImage } from '@revelationsai/server/services/user/generated-image';
import { ApiHandler } from 'sst/node/api';
import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse
} from '../../../../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  try {
    const userGeneratedImage = await getUserGeneratedImage(id);
    if (!userGeneratedImage) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid || !isObjectOwner(userGeneratedImage, userWithRoles.id)) {
      return UnauthorizedResponse('You are not authorized to view these source documents.');
    }

    const sourceDocuments = await getSourceDocumentsByUserGeneratedImageId(userGeneratedImage.id, {
      includeMetadata: true,
      includeVectors: true
    });

    return OkResponse(
      sourceDocuments.sort((a, b) => (b.distance && a.distance ? a.distance - b.distance : 0))
    );
  } catch (error) {
    console.error(`Error getting source documents for user generated image '${id}':`, error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
