import { getSessionClaimsFromEvent } from '@theaistudybible/functions/lib/user';
import { indexWebPage } from '@theaistudybible/server/lib/scraper/webpage';
import { hasRole } from '@theaistudybible/server/lib/user';
import { ApiHandler } from 'sst/node/api';
import {
  BadRequestResponse,
  ForbiddenResponse,
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse
} from '../../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  const { dataSourceId, name, url, metadata = '{}' } = JSON.parse(event.body || '{}');
  if (!dataSourceId || !url || !name) {
    return BadRequestResponse('Missing required fields');
  }

  try {
    const claims = await getSessionClaimsFromEvent(event);
    if (!claims) {
      return UnauthorizedResponse('Invalid token');
    }
    if (!hasRole('admin', claims)) {
      return ForbiddenResponse('User does not have permission to index web pages');
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
