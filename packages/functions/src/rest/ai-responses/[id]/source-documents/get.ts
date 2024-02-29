import { getAiResponse } from '@revelationsai/server/services/ai-response/ai-response';
import { validApiHandlerSession } from '@revelationsai/server/services/session';
import { getSourceDocumentsByAiResponseId } from '@revelationsai/server/services/source-document';
import { isAdminSync, isObjectOwner } from '@revelationsai/server/services/user';
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
    const aiResponse = await getAiResponse(id);
    if (!aiResponse) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid || (!isObjectOwner(aiResponse, userWithRoles.id) && !isAdminSync(userWithRoles))) {
      return UnauthorizedResponse('You are not authorized to view these source documents.');
    }

    const sourceDocuments = await getSourceDocumentsByAiResponseId(aiResponse.id);

    return OkResponse(
      sourceDocuments
        .sort((a, b) => (b.distance && a.distance ? a.distance - b.distance : 0))
        .map((sourceDocument) => {
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
