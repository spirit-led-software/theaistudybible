import { UserInfo } from "@core/model";
import { OkResponse, UnauthorizedResponse } from "@lib/api-responses";
import { validApiHandlerSession } from "@services/session";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  console.debug("Received session validation event: ", event);

  const { isValid, userAndRoles, maxQueries, remainingQueries, sessionToken } =
    await validApiHandlerSession();

  if (!isValid) {
    console.debug("Invalid session token: ", sessionToken);
    return UnauthorizedResponse("Invalid session token");
  }

  return OkResponse({
    ...userAndRoles,
    maxQueries,
    remainingQueries,
  } satisfies UserInfo);
});
