import {
  DeletedResponse,
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  UnauthorizedResponse
} from '@lib/api-responses';
import {
  deleteDataSource,
  deleteDataSourceRelatedDocuments,
  getDataSource
} from '@services/data-source';
import { validApiHandlerSession } from '@services/session';
import { ApiHandler } from 'sst/node/api';

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

    await Promise.all([
      deleteDataSource(dataSource!.id),
      deleteDataSourceRelatedDocuments(dataSource!.id)
    ]);

    return DeletedResponse();
  } catch (error) {
    console.error(`Error deleting data source '${id}':`, error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
