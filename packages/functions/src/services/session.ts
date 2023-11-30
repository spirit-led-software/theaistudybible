import { apiConfig } from '@core/configs';
import type { UserInfo, UserWithRoles } from '@core/model';
import {
  getUser,
  getUserMaxGeneratedImages,
  getUserMaxQueries,
  getUserQueryCountByUserIdAndDate,
  getUserRoles
} from '@services/user';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { useSession, type SessionValue } from 'sst/node/auth';
import { getUserGeneratedImageCountByUserIdAndDate } from './user/image-count';

export async function validApiHandlerSession(): Promise<
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
> {
  try {
    const sessionToken = useSession();
    if (sessionToken.type !== 'user') {
      return { isValid: false, sessionToken };
    }

    const [user, roles, todaysQueryCount, todaysGeneratedImageCount] = await Promise.all([
      getUser(sessionToken.properties.id),
      getUserRoles(sessionToken.properties.id),
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
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error validating token: ${err.stack}`);
    } else {
      console.error(`Error validating token: ${JSON.stringify(err)}`);
    }
    return { isValid: false };
  }
}

export async function validSessionFromEvent(event: APIGatewayProxyEventV2): Promise<
  | {
      isValid: false;
      userInfo?: UserInfo;
    }
  | {
      isValid: true;
      userInfo: UserInfo;
    }
> {
  const response = await fetch(`${apiConfig.url}/session`, {
    method: 'GET',
    headers: {
      Authorization: event.headers.authorization || ''
    },
    credentials: 'include'
  });
  if (!response.ok) {
    console.error(`Error validating token: ${response.status} ${response.statusText}`);
    return { isValid: false };
  }

  const userInfo: UserInfo = await response.json();

  return {
    isValid: true,
    userInfo
  };
}
