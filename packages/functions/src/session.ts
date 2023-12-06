import type { UserInfo } from '@core/model';
import { OkResponse, UnauthorizedResponse } from '@lib/api-responses';
import { validApiHandlerSession } from '@services/session';
import { ApiHandler } from 'sst/node/api';

export const handler = ApiHandler(async (event) => {
  console.debug('Received session validation event: ', event);

  const {
    isValid,
    userWithRoles,
    maxQueries,
    remainingQueries,
    sessionToken,
    maxGeneratedImages,
    remainingGeneratedImages
  } = await validApiHandlerSession();

  if (!isValid) {
    console.debug('Invalid session token: ', sessionToken);
    return UnauthorizedResponse('Invalid session token');
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...user } = userWithRoles;
  return OkResponse({
    ...user,
    maxQueries,
    remainingQueries,
    maxGeneratedImages,
    remainingGeneratedImages
  } satisfies UserInfo);
});
