import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { getDataSource } from "@services/data-source";
import { validApiHandlerSession } from "@services/session";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;

  try {
    const { isValid } = await validApiHandlerSession();
    if (!isValid) {
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
