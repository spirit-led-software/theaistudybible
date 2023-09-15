import { apiConfig } from "@core/configs";
import { UserInfo, UserWithRoles } from "@core/model";
import {
  createUserQueryCount,
  getUser,
  getUserMaxQueries,
  getUserQueryCountByUserIdAndDate,
  getUserRoles,
} from "@services/user";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { SessionValue, useSession } from "sst/node/auth";

export async function validApiHandlerSession(): Promise<
  | {
      isValid: false;
      sessionToken?: SessionValue;
      userWithRoles?: UserWithRoles;
      maxQueries?: number;
      remainingQueries?: number;
    }
  | {
      isValid: true;
      sessionToken: SessionValue;
      userWithRoles: UserWithRoles;
      maxQueries: number;
      remainingQueries: number;
    }
> {
  try {
    const sessionToken = useSession();
    if (sessionToken.type !== "user") {
      return { isValid: false, sessionToken };
    }

    const [user, roles, todaysQueryCount] = await Promise.all([
      getUser(sessionToken.properties.id),
      getUserRoles(sessionToken.properties.id),
      getUserQueryCountByUserIdAndDate(sessionToken.properties.id, new Date()),
    ]).catch((err) => {
      console.error("Error validating token:", err);
      return [null, null, null];
    });
    if (!user || !roles) {
      return { isValid: false, sessionToken };
    }

    const userWithRoles = {
      ...user,
      roles,
    };
    const maxQueries = getUserMaxQueries(userWithRoles);

    let count = 0;
    if (todaysQueryCount) {
      count = todaysQueryCount.count;
    } else {
      const newQueryCount = await createUserQueryCount({
        userId: userWithRoles.id,
        count: 0,
      });
      count = newQueryCount.count;
    }

    return {
      isValid: true,
      sessionToken,
      userWithRoles: userWithRoles,
      maxQueries,
      remainingQueries: maxQueries - count,
    };
  } catch (err: any) {
    console.error("Error validating token:", err);
    return { isValid: false };
  }
}

export async function validSessionFromEvent(
  event: APIGatewayProxyEventV2
): Promise<
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
    method: "GET",
    headers: {
      Authorization: event.headers.authorization || "",
    },
    credentials: "include",
  });
  if (!response.ok) {
    console.error(
      `Error validating token: ${response.status} ${response.statusText}`
    );
    return { isValid: false };
  }

  const userInfo: UserInfo = await response.json();

  return {
    isValid: true,
    userInfo,
  };
}
