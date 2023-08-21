import { UserWithRoles } from "@core/model";
import {
  NotFoundResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { getUser, getUserRoles } from "@services/user";
import { ApiHandler } from "sst/node/api";
import { useSession } from "sst/node/auth";

export const handler = ApiHandler(async (event) => {
  console.debug("Received session validation event: ", event);
  const session = useSession();

  if (session.type !== "user") {
    return UnauthorizedResponse();
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

  console.debug("Returning user: ", userWithRoles);
  return OkResponse(userWithRoles);
});
