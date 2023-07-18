import {
  createIndexOperation,
  updateIndexOperation,
} from "@core/services/index-op";
import { isAdmin, validApiSession } from "@core/services/user";
import { IndexOperation } from "@revelationsai/core/database/model";
import { ApiHandler } from "sst/node/api";
import { generatePageContentEmbeddings } from "../lib/scraper";

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

    generatePageContentEmbeddings(name, url)
      .then(async () => {
        console.log(
          `Successfully indexed url '${url}'. Updating index op status.`
        );
        indexOp = await updateIndexOperation(indexOp?.id!, {
          status: "SUCCEEDED",
        });
      })
      .catch((err) => {
        console.error(err.stack);
        updateIndexOperation(indexOp?.id!, {
          status: "FAILED",
          metadata: {
            ...indexOpMetadata,
            error: err.stack,
          },
        });
      });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Started indexing url",
        url,
      }),
    };
  } catch (err: any) {
    console.error(err.stack);

    if (indexOp) {
      await updateIndexOperation(indexOp.id, {
        status: "FAILED",
        metadata: {
          ...indexOpMetadata,
          error: err.stack,
        },
      });
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.stack,
      }),
    };
  }
});
