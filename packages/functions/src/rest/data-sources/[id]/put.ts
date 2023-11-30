import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse
} from '@lib/api-responses';
import {
  getDataSource,
  updateDataSource,
  updateDataSourceRelatedDocuments
} from '@services/data-source';
import { validApiHandlerSession } from '@services/session';
import { isAdmin } from '@services/user';
import { ApiHandler } from 'sst/node/api';

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  const data = JSON.parse(event.body ?? '{}');

  try {
    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid || !(await isAdmin(userWithRoles.id))) {
      return UnauthorizedResponse();
    }

    let dataSource = await getDataSource(id);
    if (!dataSource) {
      return ObjectNotFoundResponse(id);
    }

    [dataSource] = await Promise.all([
      updateDataSource(dataSource!.id, data),
      updateDataSourceRelatedDocuments(dataSource!.id, dataSource!)
    ]);

    return OkResponse(dataSource);
  } catch (error) {
    console.error(`Error updating data source '${id}':`, error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
