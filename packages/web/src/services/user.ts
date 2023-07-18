import { apiConfig } from "@configs/index";
import { isAdmin, isObjectOwner } from "@core/services/user";
import { User } from "@revelationsai/core/database/model";
import { cookies } from "next/headers";

export async function validServerSession(): Promise<
  | {
      isValid: false;
      userInfo?: never;
    }
  | {
      isValid: true;
      userInfo: User;
    }
> {
  const sessionToken = cookies().get("session");
  if (!sessionToken?.value) {
    console.error("Could not find session token in cookies.");
    return { isValid: false };
  }

  const response = await fetch(`${apiConfig.url}/session`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${sessionToken.value}`,
    },
  });
  if (response.status !== 200) {
    console.error("Invalid session token received: ", sessionToken.value);
    return { isValid: false };
  }

  const userInfo: User = await response.json();

  return {
    isValid: true,
    userInfo,
  };
}

export async function validObjectOwner(object: { userId: string }): Promise<
  | {
      isValid: false;
      userInfo?: User;
    }
  | {
      isValid: true;
      userInfo: User;
    }
> {
  const { isValid, userInfo } = await validServerSession();
  if (!isValid) {
    return { isValid: false };
  }

  if (!isObjectOwner(object, userInfo.id) && !(await isAdmin(userInfo.id))) {
    return { isValid: false, userInfo };
  }

  return { isValid: true, userInfo };
}
