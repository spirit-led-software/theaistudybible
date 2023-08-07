import {
  deleteIndexOperation,
  getIndexOperation,
} from "@core/services/index-op";
import { validApiSession } from "@core/services/session";
import { isAdmin } from "@core/services/user";
import {
  DeletedResponse,
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;

  try {
    const { isValid, userInfo } = await validApiSession();
    if (!isValid || !(await isAdmin(userInfo.id))) {
      return UnauthorizedResponse();
    }

    const indexOp = await getIndexOperation(id);
    if (!indexOp) {
      return ObjectNotFoundResponse(id);
    }

    await deleteIndexOperation(indexOp!.id);

    return DeletedResponse();
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
