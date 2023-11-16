import {
  DeletedResponse,
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { deleteDataSource, getDataSource } from "@services/data-source";
import { validApiHandlerSession } from "@services/session";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;

  try {
    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid || !userWithRoles.id) {
      return UnauthorizedResponse();
    }

    const dataSource = await getDataSource(id);
    if (!dataSource) {
      return ObjectNotFoundResponse(id);
    }

    await deleteDataSource(dataSource!.id);

    return DeletedResponse();
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
