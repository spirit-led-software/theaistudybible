import {
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import {
  getIndexOperationOrThrow,
  updateIndexOperation,
} from "@services/index-op";
import { validApiHandlerSession } from "@services/session";
import { isAdmin } from "@services/user";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  const data = JSON.parse(event.body ?? "{}");

  try {
    const { isValid, userAndRoles: userInfo } = await validApiHandlerSession();
    if (!isValid || !(await isAdmin(userInfo.id))) {
      return UnauthorizedResponse();
    }

    let indexOp = await getIndexOperationOrThrow(id);

    indexOp = await updateIndexOperation(indexOp!.id, data);

    return OkResponse(indexOp);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
