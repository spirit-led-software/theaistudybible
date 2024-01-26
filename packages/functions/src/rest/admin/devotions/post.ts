import { generateDevotion } from '@revelationsai/server/lib/util/devotion';
import { validApiHandlerSession } from '@revelationsai/server/services/session';
import { isAdminSync } from '@revelationsai/server/services/user';
import { ApiHandler } from 'sst/node/api';
import {
  CreatedResponse,
  InternalServerErrorResponse,
  UnauthorizedResponse
} from '../../../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  console.log('Received devotion create event:', event);

  const { topic, bibleVerse } = JSON.parse(event.body ?? '{}');

  try {
    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid || !isAdminSync(userWithRoles)) {
      return UnauthorizedResponse();
    }

    const devo = await generateDevotion(topic, bibleVerse);

    return CreatedResponse(devo);
  } catch (error) {
    console.error('Error creating devotion:', error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
