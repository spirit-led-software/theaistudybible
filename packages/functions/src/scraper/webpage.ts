import type { IndexOperation } from "@core/model";
import {
  BadRequestResponse,
  ForbiddenResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { createIndexOperation, updateIndexOperation } from "@services/index-op";
import { validApiHandlerSession } from "@services/session";
import { isAdmin } from "@services/user";
import { ApiHandler } from "sst/node/api";
import { generatePageContentEmbeddings } from "../lib/web-scraper";

export const handler = ApiHandler(async (event) => {
  const { isValid, userWithRoles } = await validApiHandlerSession();
  if (!isValid) {
    return UnauthorizedResponse();
  }

  if (!(await isAdmin(userWithRoles.id))) {
    return ForbiddenResponse();
  }

  const { name, url, metadata = "{}" } = JSON.parse(event.body || "{}");
  if (!url || !name) {
    return BadRequestResponse("Missing required fields");
  }

  let indexOp: IndexOperation | undefined;
  try {
    indexOp = await createIndexOperation({
      status: "RUNNING",
      type: "WEBPAGE",
      metadata: {
        ...JSON.parse(metadata),
        name,
        url,
      },
    });

    console.log(`Started indexing url '${url}'.`);
    await generatePageContentEmbeddings(name, url, metadata);

    console.log(`Successfully indexed url '${url}'. Updating index op status.`);
    indexOp = await updateIndexOperation(indexOp?.id!, {
      status: "SUCCEEDED",
    });

    return OkResponse({
      message: "Success",
      indexOp,
    });
  } catch (err: any) {
    console.error(err.stack);

    if (indexOp) {
      indexOp = await updateIndexOperation(indexOp.id, {
        status: "FAILED",
        metadata: {
          ...indexOp.metadata,
          error: err.stack,
        },
      });
      return OkResponse({
        error: err.stack,
        indexOp,
      });
    }

    return BadRequestResponse(err.stack);
  }
});
