import { validApiHandlerSession } from '@revelationsai/server/services/session';
import { createUserMessage } from '@revelationsai/server/services/user/message';
import { ApiHandler } from 'sst/node/api';
import {
  UnauthorizedResponse,
  CreatedResponse,
  InternalServerErrorResponse
} from '../../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  const data = JSON.parse(event.body ?? '{}');

  try {
    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid) {
      return UnauthorizedResponse('You must be logged in.');
    }

    const message = await createUserMessage({
      ...data,
      userId: userWithRoles.id
    });

    return CreatedResponse(message);
  } catch (error) {
    console.error('Error creating user message:', error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
