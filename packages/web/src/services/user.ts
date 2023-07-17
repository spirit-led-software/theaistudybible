import { User } from "@chatesv/core/database/model";
import { apiConfig } from "@configs/index";
import { isAdmin, isObjectOwner } from "@core/services/user";

export async function validServerSession(sessionToken: string): Promise<
  | {
      isValid: false;
      userId?: never;
    }
  | {
      isValid: true;
      userId: string;
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

  const user: User = await response.json();

  return {
    isValid: true,
    userId: user.id,
  };
}

export async function validServerSessionAndObjectOwner(
  sessionToken,
  object: {
    userId: string;
  }
): Promise<
  | {
      isValid: false;
      userId?: string;
    }
  | {
      isValid: true;
      userId: string;
    }
> {
  const { isValid, userId } = await validServerSession(sessionToken);
  if (!isValid) {
    return { isValid: false };
  }

  if (!isObjectOwner(object, userId) && !(await isAdmin(userId))) {
    return { isValid: false, userId };
  }

  return { isValid: true, userId };
}
