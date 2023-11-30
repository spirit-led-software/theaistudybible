import {
  CreatedResponse,
  InternalServerErrorResponse,
  UnauthorizedResponse
} from '@lib/api-responses';
import { generateDevotion } from '@services/devotion';
import { validApiHandlerSession } from '@services/session';
import { isAdmin } from '@services/user';
import { ApiHandler } from 'sst/node/api';

export const handler = ApiHandler(async (event) => {
  console.log('Received devotion create event:', event);

  const { topic, bibleVerse } = JSON.parse(event.body ?? '{}');

  try {
    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid || !(await isAdmin(userWithRoles.id))) {
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
