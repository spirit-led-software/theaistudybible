import { createAiResponse } from '@revelationsai/server/services/ai-response/ai-response';
import { validApiHandlerSession } from '@revelationsai/server/services/session';
import { ApiHandler } from 'sst/node/api';
import {
  CreatedResponse,
  InternalServerErrorResponse,
  UnauthorizedResponse
} from '../../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  const data = JSON.parse(event.body ?? '{}');
  try {
    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid) {
      return UnauthorizedResponse('You must be logged in');
    }
    const aiResponse = await createAiResponse({
      ...data,
      userId: userWithRoles.id
    });

    return CreatedResponse(aiResponse);
  } catch (error) {
    console.error('Error creating AI response:', error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
