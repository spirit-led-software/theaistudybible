import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { getDataSource } from "@services/data-source";
import { validApiHandlerSession } from "@services/session";
import { isAdmin } from "@services/user";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;

  try {
    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid || !(await isAdmin(userWithRoles.id))) {
      return UnauthorizedResponse();
    }

    const dataSource = await getDataSource(id);
    if (!dataSource) {
      return ObjectNotFoundResponse(id);
    }

    return OkResponse(dataSource);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
