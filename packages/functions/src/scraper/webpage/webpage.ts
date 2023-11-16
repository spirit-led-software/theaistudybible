import {
  BadRequestResponse,
  ForbiddenResponse,
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { indexWebPage } from "@services/data-source/index-op";
import { validApiHandlerSession } from "@services/session";
import { isAdmin } from "@services/user";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const {
    dataSourceId,
    name,
    url,
    metadata = "{}",
  } = JSON.parse(event.body || "{}");
  if (!dataSourceId || !url || !name) {
    return BadRequestResponse("Missing required fields");
  }

  try {
    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid) {
      return UnauthorizedResponse();
    }

    if (!(await isAdmin(userWithRoles.id))) {
      return ForbiddenResponse();
    }

    const indexOp = await indexWebPage({
      dataSourceId,
      name,
      url,
      metadata: JSON.parse(metadata),
    });

    return OkResponse({
      message: "Success",
      indexOp,
    });
  } catch (err: any) {
    console.error(err.stack);
    return InternalServerErrorResponse(err.stack);
  }
});
