import { apiConfig } from "@core/configs";
import { UserWithRoles } from "@core/model";
import { getUser, getUserRoles } from "@services/user";
import { SessionValue, useSession } from "sst/node/auth";

export async function validApiHandlerSession(): Promise<
  | {
      isValid: false;
      sessionToken?: SessionValue;
      userInfo?: UserWithRoles;
    }
  | {
      isValid: true;
      sessionToken: SessionValue;
      userInfo: UserWithRoles;
    }
> {
  try {
    const sessionToken = useSession();
    if (!sessionToken || sessionToken.type !== "user") {
      return { isValid: false, sessionToken };
    }

    const user = await getUser(sessionToken.properties.id);
    if (!user) {
      return { isValid: false, sessionToken };
    }

    const roles = await getUserRoles(user.id);

    const userInfo = {
      ...user,
      roles,
    };

    return {
      isValid: true,
      sessionToken,
      userInfo,
    };
  } catch (err: any) {
    console.error("Error validating token:", err);
    return { isValid: false };
  }
}

export async function validSessionToken(token: string): Promise<
  | {
      isValid: false;
      userInfo?: UserWithRoles;
    }
  | {
      isValid: true;
      userInfo: UserWithRoles;
    }
> {
  const response = await fetch(`${apiConfig.url}/session`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (response.status !== 200) {
    return { isValid: false };
  }

  const userInfo = await response.json();

  return {
    isValid: true,
    userInfo,
  };
}
