import { SessionValue, useSession } from "sst/node/auth";
import { apiConfig } from "../configs";
import { User } from "../database/model";
import { getUser } from "./user";

export async function validApiSession(): Promise<
  | {
      isValid: false;
      sessionToken?: SessionValue;
      userInfo?: never;
    }
  | {
      isValid: true;
      sessionToken: SessionValue;
      userInfo: User;
    }
> {
  const sessionToken = useSession();
  if (!sessionToken || sessionToken.type !== "user") {
    return { isValid: false, sessionToken };
  }

  const userInfo = await getUser(sessionToken.properties.id);
  if (!userInfo) {
    return { isValid: false, sessionToken };
  }

  return {
    isValid: true,
    sessionToken,
    userInfo,
  };
}

export async function validSessionToken(token: string): Promise<
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
      Authorization: `Bearer ${token}`,
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
