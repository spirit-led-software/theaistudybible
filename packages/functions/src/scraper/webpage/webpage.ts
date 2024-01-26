import { indexWebPage } from '@revelationsai/server/services/scraper/webpage';
import { validApiHandlerSession } from '@revelationsai/server/services/session';
import { isAdmin } from '@revelationsai/server/services/user';
import { ApiHandler } from 'sst/node/api';
import {
  BadRequestResponse,
  UnauthorizedResponse,
  ForbiddenResponse,
  OkResponse,
  InternalServerErrorResponse
} from '../../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  const { dataSourceId, name, url, metadata = '{}' } = JSON.parse(event.body || '{}');
  if (!dataSourceId || !url || !name) {
    return BadRequestResponse('Missing required fields');
  }

  try {
    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid) {
      return UnauthorizedResponse();
    }

    if (!(await isAdmin(userWithRoles.id))) {
      return ForbiddenResponse();
    }

    const indexOp = await indexWebPage({
      dataSourceId,
      name,
      url,
      metadata: JSON.parse(metadata)
    });

    return OkResponse({
      message: 'Success',
      indexOp
    });
  } catch (err) {
    console.error(`Error indexing web page '${url}':`, err);
    if (err instanceof Error) {
      return InternalServerErrorResponse(`${err.message}\n${err.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(err));
    }
  }
});
