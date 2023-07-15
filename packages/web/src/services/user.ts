import config from "@configs/next-auth";
import { getUserByEmail, isAdmin, isObjectOwner } from "@core/services/user";
import { User } from "@prisma/client";
import { getServerSession } from "next-auth";

export async function validServerSession(): Promise<
  | {
      isValid: false;
      user?: User;
    }
  | {
      isValid: true;
      user: User;
    }
> {
  const session = await getServerSession(config);
  if (!session || !session.user || !session.user.email) {
    return { isValid: false };
  }

  const user = await getUserByEmail(session.user.email);
  if (!user) {
    return { isValid: false };
  }

  return {
    isValid: true,
    user,
  };
}

export async function validSessionAndObjectOwner(object: {
  userId: string;
}): Promise<
  | {
      isValid: false;
      user?: User;
    }
  | {
      isValid: true;
      user: User;
    }
> {
  const { isValid, user } = await validServerSession();
  if (!isValid) {
    return { isValid: false };
  }

  if (!isObjectOwner(object, user) && !(await isAdmin(user.id))) {
    return { isValid: false, user };
  }

  return { isValid: true, user };
}
