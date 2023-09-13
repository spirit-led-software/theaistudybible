import {
  DeletedResponse,
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { deleteIndexOperation, getIndexOperation } from "@services/index-op";
import { validApiHandlerSession } from "@services/session";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;

  try {
    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid || !userWithRoles.id) {
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
