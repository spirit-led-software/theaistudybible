import { SessionValue, useSession } from "sst/node/auth";
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
