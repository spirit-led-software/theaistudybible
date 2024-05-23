import { getSessionClaimsFromEvent } from '@theaistudybible/functions/lib/user';
import { indexRemoteFile } from '@theaistudybible/server/lib/scraper/file';
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
  console.log('Received remote file download event:', event);

  const { name, url, metadata = '{}', dataSourceId } = JSON.parse(event.body || '{}');

  if (!name || !url) {
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

    await indexRemoteFile({
      name,
      url,
      dataSourceId,
      metadata: JSON.parse(metadata)
    });

    return OkResponse({
      body: 'Success'
    });
  } catch (error) {
    console.error(`Error indexing remote file '${url}':`, error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
