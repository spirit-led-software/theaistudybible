import {
  getDataSource,
  updateDataSource,
  updateDataSourceRelatedDocuments
} from '@revelationsai/server/services/data-source';
import { validApiHandlerSession } from '@revelationsai/server/services/session';
import { isAdminSync } from '@revelationsai/server/services/user';
import { ApiHandler } from 'sst/node/api';
import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse
} from '../../../../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  const data = JSON.parse(event.body ?? '{}');

  try {
    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid || !isAdminSync(userWithRoles)) {
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
