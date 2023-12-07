import { OkResponse, UnauthorizedResponse } from '@lib/api-responses';
import { validApiHandlerSession } from '@services/session';
import { ApiHandler } from 'sst/node/api';
import { Session } from 'sst/node/auth';

export const handler = ApiHandler(async (event) => {
  console.debug('Received session validation event: ', event);

  const { isValid, sessionToken, userWithRoles } = await validApiHandlerSession();

  if (!isValid) {
    console.debug('Invalid session token: ', sessionToken);
    return UnauthorizedResponse('Invalid session token');
  }

  const refreshSession = Session.create({
    type: 'user',
    options: {
      expiresIn: 1000 * 60 * 60 * 24 * 7, // = 30 days = MS * S * M * H * D
      sub: userWithRoles.id
    },
    properties: {
      id: userWithRoles.id
    }
  });
  return OkResponse({
    session: sessionToken,
    refreshSession
  });
});
