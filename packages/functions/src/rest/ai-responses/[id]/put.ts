import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse
} from '@lib/api-responses';
import { getAiResponse, updateAiResponse } from '@services/ai-response/ai-response';
import { validApiHandlerSession } from '@services/session';
import { isObjectOwner } from '@services/user';
import { ApiHandler } from 'sst/node/api';

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  const data = JSON.parse(event.body ?? '{}');

  try {
    let aiResponse = await getAiResponse(id);
    if (!aiResponse) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid || !isObjectOwner(aiResponse, userWithRoles.id)) {
      return UnauthorizedResponse('You are not authorized to update this response');
    }

    aiResponse = await updateAiResponse(aiResponse.id, data);

    return OkResponse(aiResponse);
  } catch (error) {
    console.error(`Error updating ai response '${id}':`, error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
