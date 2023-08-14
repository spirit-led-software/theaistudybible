import { UserWithRoles } from "@core/model";
import { NotFoundResponse, OkResponse } from "@lib/api-responses";
import { getUser, getUserRoles } from "@services/user";
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
    return NotFoundResponse("User not found");
  }

  const roles = await getUserRoles(user.id);

  const userWithRoles: UserWithRoles = {
    ...user,
    roles,
  };

  return OkResponse(userWithRoles);
});
