import { User } from "@chatesv/core/database/model";
import { apiConfig } from "@configs/index";
import { isAdmin, isObjectOwner } from "@core/services/user";

export function getSessionTokenFromRequest(
  request: Request
): string | undefined {
  const authorization = request.headers.get("Authorization");
  if (!authorization) {
    return undefined;
  }

  const [type, token] = authorization.split(" ");
  if (type !== "Bearer") {
    return undefined;
  }

  return token;
}

export async function validServerSession(sessionToken: string): Promise<
  | {
      isValid: false;
      userInfo?: never;
    }
  | {
      isValid: true;
      userInfo: User;
    }
> {
  const response = await fetch(`${apiConfig.url}/session`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
  });

  if (response.status !== 200) {
    return { isValid: false };
  }

  const userInfo: User = await response.json();

  return {
    isValid: true,
    userInfo,
  };
}

export async function validServerSessionFromRequest(request: Request): Promise<
  | {
      isValid: false;
      userInfo?: never;
    }
  | {
      isValid: true;
      userInfo: User;
    }
> {
  const sessionToken = getSessionTokenFromRequest(request);
  return sessionToken ? validServerSession(sessionToken) : { isValid: false };
}

export async function validObjectOwner(
  sessionToken: string,
  object: {
    userId: string;
  }
): Promise<
  | {
      isValid: false;
      userInfo?: User;
    }
  | {
      isValid: true;
      userInfo: User;
    }
> {
  const { isValid, userInfo } = await validServerSession(sessionToken);
  if (!isValid) {
    return { isValid: false };
  }

  if (!isObjectOwner(object, userInfo.id) && !(await isAdmin(userInfo.id))) {
    return { isValid: false, userInfo };
  }

  return { isValid: true, userInfo };
}

export async function validObjectOwnerFromRequest(
  request: Request,
  object: {
    userId: string;
  }
): Promise<
  | {
      isValid: false;
      userInfo?: User;
    }
  | {
      isValid: true;
      userInfo: User;
    }
> {
  const { isValid, userInfo } = await validServerSessionFromRequest(request);
  if (!isValid) {
    return { isValid: false };
  }

  if (!isObjectOwner(object, userInfo.id) && !(await isAdmin(userInfo.id))) {
    return { isValid: false, userInfo };
  }

  return { isValid: true, userInfo };
}
