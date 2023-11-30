import {
  DeletedResponse,
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  UnauthorizedResponse
} from '@lib/api-responses';
import { deleteAiResponse, getAiResponse } from '@services/ai-response/ai-response';
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
      return UnauthorizedResponse('You are not authorized to delete this response');
    }

    await deleteAiResponse(aiResponse.id);
    return DeletedResponse(aiResponse.id);
  } catch (error) {
    console.error(`Error deleting ai response '${id}':`, error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
