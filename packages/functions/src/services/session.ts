import type { UserWithRoles } from '@core/model/user';
import { getUser, getUserMaxGeneratedImages, getUserMaxQueries } from '@services/user';
import { getUserGeneratedImageCountByUserIdAndDate } from '@services/user/image-count';
import { getUserQueryCountByUserIdAndDate } from '@services/user/query-count';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { createVerifier } from 'fast-jwt';
import { getPublicKey, useSession, type SessionValue } from 'sst/node/auth';
import { getRolesByUserId } from './role';

type ReturnType = Promise<
  | {
      isValid: false;
      sessionToken?: SessionValue;
      userWithRoles?: UserWithRoles;
      maxQueries?: number;
      remainingQueries?: number;
      maxGeneratedImages?: number;
      remainingGeneratedImages?: number;
    }
  | {
      isValid: true;
      sessionToken: SessionValue;
      userWithRoles: UserWithRoles;
      maxQueries: number;
      remainingQueries: number;
      maxGeneratedImages: number;
      remainingGeneratedImages: number;
    }
>;

async function getUserAtts(sessionToken: SessionValue): ReturnType {
  if (sessionToken.type !== 'user') {
    return { isValid: false, sessionToken };
  }

  const [user, roles, todaysQueryCount, todaysGeneratedImageCount] = await Promise.all([
    getUser(sessionToken.properties.id),
    getRolesByUserId(sessionToken.properties.id),
    getUserQueryCountByUserIdAndDate(sessionToken.properties.id, new Date()),
    getUserGeneratedImageCountByUserIdAndDate(sessionToken.properties.id, new Date())
  ]).catch((err) => {
    console.error('Error validating token:', err);
    return [null, null, null, null];
  });
  if (!user || !roles) {
    return { isValid: false, sessionToken };
  }

  const userWithRoles = {
    ...user,
    roles
  };

  let count = 0;
  if (todaysQueryCount) {
    count = todaysQueryCount.count;
  }
  const maxQueries = getUserMaxQueries(userWithRoles);

  let imageCount = 0;
  if (todaysGeneratedImageCount) {
    imageCount = todaysGeneratedImageCount.count;
  }
  const maxImages = getUserMaxGeneratedImages(userWithRoles);

  console.debug(
    `Returning userWithRoles: ${JSON.stringify(
      userWithRoles
    )}, maxQueries: ${maxQueries}, remainingQueries: ${
      maxQueries - count
    }, maxImages: ${maxImages}, remainingImages: ${maxImages - imageCount}`
  );

  return {
    isValid: true,
    sessionToken,
    userWithRoles: userWithRoles,
    maxQueries,
    remainingQueries: maxQueries - count,
    maxGeneratedImages: maxImages,
    remainingGeneratedImages: maxImages - imageCount
  };
}

export async function validApiHandlerSession(): ReturnType {
  try {
    const sessionToken = useSession();
    return await getUserAtts(sessionToken);
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error validating token: ${err.stack}`);
    } else {
      console.error(`Error validating token: ${JSON.stringify(err)}`);
    }
    return { isValid: false };
  }
}

/**
 * This function is used to validate a session token from a non-API handler function.
 * The function that calls this function must be bound to the auth construct instance.
 *
 * @param event Event from API Gateway
 * @returns A promise that resolves to an object with the following properties:
 */
export async function validNonApiHandlerSession(event: APIGatewayProxyEventV2): ReturnType {
  try {
    const token = event.headers.authorization?.split(' ')[1];
    if (!token) {
      console.error('No token provided');
      return { isValid: false };
    }

    const jwt = createVerifier({
      algorithms: ['RS512'],
      key: getPublicKey()
    })(token) as SessionValue;

    return await getUserAtts(jwt);
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error validating token: ${err.stack}`);
    } else {
      console.error(`Error validating token: ${JSON.stringify(err)}`);
    }
    return { isValid: false };
  }
}
