import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse
} from '@lib/api-responses';
import { getAiResponse, getAiResponseSourceDocuments } from '@services/ai-response/ai-response';
import { validApiHandlerSession } from '@services/session';
import { isObjectOwner } from '@services/user';
import { ApiHandler } from 'sst/node/api';

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  try {
    const aiResponse = await getAiResponse(id);
    if (!aiResponse) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid || !isObjectOwner(aiResponse, userWithRoles.id)) {
      return UnauthorizedResponse('You are not authorized to see these source documents.');
    }

    const sourceDocuments = await getAiResponseSourceDocuments(aiResponse);

    return OkResponse(
      sourceDocuments.map((sourceDocument) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { embedding, ...rest } = sourceDocument;
        return rest;
      })
    );
  } catch (error) {
    console.error(`Error getting source documents for ai response '${id}':`, error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
