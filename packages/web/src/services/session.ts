import { apiConfig } from "@configs/index";
import { UserWithRoles } from "@core/model";
import { cookies } from "next/headers";

export function getSessionTokenFromCookies() {
  const sessionToken = cookies().get("session");
  return sessionToken?.value;
}

export async function validServerSession(): Promise<
  | {
      isValid: false;
      token?: string;
      userInfo?: UserWithRoles;
    }
  | {
      isValid: true;
      token: string;
      userInfo: UserWithRoles;
    }
> {
  const sessionToken = getSessionTokenFromCookies();
  if (!sessionToken) {
    return { isValid: false };
  }

  const response = await fetch(`${apiConfig.url}/session`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
  });
  if (response.status !== 200) {
    return { isValid: false };
  }

  const userInfo = await response.json();

  return {
    isValid: true,
    token: sessionToken,
    userInfo,
  };
}

export function isAdmin(userInfo: UserWithRoles) {
  if (userInfo.roles.find((role) => role.name === "admin")) {
    return true;
  }
  return false;
}
