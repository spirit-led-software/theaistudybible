import {
  BadRequestResponse,
  ForbiddenResponse,
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { indexWebCrawl } from "@services/data-source/index-op";
import { validApiHandlerSession } from "@services/session";
import { isAdmin } from "@services/user";
import { ApiHandler } from "sst/node/api";

type RequestBody = {
  dataSourceId: string;
  url: string;
  pathRegex: string;
  name: string;
  metadata?: string;
};

export const handler = ApiHandler(async (event) => {
  console.log("Received web crawl event:", event);

  const { isValid, userWithRoles } = await validApiHandlerSession();
  if (!isValid) {
    return UnauthorizedResponse("You must be logged in to perform this action");
  }

  if (!(await isAdmin(userWithRoles.id))) {
    return ForbiddenResponse("You must be an admin to perform this action");
  }

  const {
    dataSourceId,
    url,
    pathRegex: pathRegexString,
    name,
    metadata = "{}",
  }: RequestBody = JSON.parse(event.body || "{}");

  if (!name || !url) {
    return BadRequestResponse("Name and url are required");
  }

  if (
    pathRegexString &&
    (pathRegexString.startsWith("/") ||
      pathRegexString.startsWith("\\/") ||
      pathRegexString.endsWith("/") ||
      pathRegexString.endsWith("\\/"))
  ) {
    return BadRequestResponse(
      "Path regex cannot start or end with a forward slash"
    );
  }

  try {
    const indexOp = await indexWebCrawl({
      dataSourceId,
      url,
      pathRegex: pathRegexString,
      name,
      metadata: JSON.parse(metadata),
    });

    return OkResponse({
      message: "Website index operation started",
      indexOp,
    });
  } catch (err: any) {
    return InternalServerErrorResponse(err.stack);
  }
});
