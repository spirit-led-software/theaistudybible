import { apiConfig } from "@configs";
import { UserWithRoles } from "@core/model";

export async function validSession(token?: string): Promise<
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
  if (!token) {
    console.error("No session token found in cookies or options.");
    return { isValid: false };
  }

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
    token,
    userInfo,
  };
}

export function isAdmin(userInfo: UserWithRoles) {
  if (userInfo.roles.find((role) => role.name === "admin")) {
    return true;
  }
  return false;
}
