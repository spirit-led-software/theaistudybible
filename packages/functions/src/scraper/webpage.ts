import {
  createIndexOperation,
  updateIndexOperation,
} from "@core/services/index-op";
import { validApiSession } from "@core/services/session";
import { isAdmin } from "@core/services/user";
import { IndexOperation } from "@revelationsai/core/database/model";
import { ApiHandler } from "sst/node/api";
import { generatePageContentEmbeddings } from "../lib/web-scraper";

export const handler = ApiHandler(async (event) => {
  const { isValid, userInfo } = await validApiSession();
  if (!isValid) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        error: "Unauthorized",
      }),
    };
  }

  if (!(await isAdmin(userInfo.id))) {
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
  let indexOpMetadata: any = undefined;
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
          ...indexOpMetadata,
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
