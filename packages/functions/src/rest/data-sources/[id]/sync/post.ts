import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { getDataSource, syncDataSource } from "@services/data-source";
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

    let dataSource = await getDataSource(id);
    if (!dataSource) {
      return ObjectNotFoundResponse(id);
    }

    await syncDataSource(dataSource.id, true);

    return OkResponse(dataSource);
  } catch (error: any) {
    console.error("Error syncing data source:", error.stack);
    return InternalServerErrorResponse(error.stack);
  }
});
