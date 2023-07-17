import { getUser } from "@core/services/user";
import { ApiHandler } from "sst/node/api";
import { useSession } from "sst/node/auth";

export const handler = ApiHandler(async () => {
  const session = useSession();

  if (session.type !== "user") {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }

  const user = await getUser(session.properties.id);
  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "User not found" }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(user),
  };
});
