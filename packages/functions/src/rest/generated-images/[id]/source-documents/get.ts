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

    const sourceDocuments = await getSourceDocumentsByUserGeneratedImageId(userGeneratedImage.id);

    return OkResponse(
      sourceDocuments
        .sort((a, b) => (b.score && a.score ? a.score - b.score : 0))
        .map((sourceDocument) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { vector, ...rest } = sourceDocument;
          return rest;
        })
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
