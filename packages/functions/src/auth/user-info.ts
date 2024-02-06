import type { UserInfo } from '@revelationsai/core/model/user';
import { validApiHandlerSession } from '@revelationsai/server/services/session';
import { ApiHandler } from 'sst/node/api';
import { OkResponse, UnauthorizedResponse } from '../lib/api-responses';

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
  return OkResponse({
    ...userWithRoles,
    maxQueries,
    remainingQueries,
    maxGeneratedImages,
    remainingGeneratedImages
  } satisfies UserInfo);
});