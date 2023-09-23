import type { IndexOperation } from "@core/model";
import { createIndexOperation, updateIndexOperation } from "@services/index-op";
import { validApiHandlerSession } from "@services/session";
import { isAdmin } from "@services/user";
import { ApiHandler } from "sst/node/api";
import { generatePageContentEmbeddings } from "../lib/web-scraper";

export const handler = ApiHandler(async (event) => {
  const { isValid, userWithRoles } = await validApiHandlerSession();
  if (!isValid) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        error: "Unauthorized",
      }),
    };
  }

  if (!(await isAdmin(userWithRoles.id))) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        error: "Forbidden",
      }),
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Missing body",
      }),
    };
  }

  const { name, url } = JSON.parse(event.body);
  if (!url || !name) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Missing required fields",
      }),
    };
  }

  let indexOp: IndexOperation | undefined;
  try {
    indexOp = await createIndexOperation({
      status: "RUNNING",
      type: "WEBPAGE",
      metadata: {
        name,
        url,
      },
    });

    console.log(`Started indexing url '${url}'.`);
    await generatePageContentEmbeddings(name, url);

    console.log(`Successfully indexed url '${url}'. Updating index op status.`);
    indexOp = await updateIndexOperation(indexOp?.id!, {
      status: "SUCCEEDED",
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Index successful!",
        indexOp,
      }),
    };
  } catch (err: any) {
    console.error(err.stack);

    if (indexOp) {
      indexOp = await updateIndexOperation(indexOp.id, {
        status: "FAILED",
        metadata: {
          ...(indexOp.metadata as any),
          error: err.stack,
        },
      });
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: err.stack,
          indexOp,
        }),
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.stack,
      }),
    };
  }
});
