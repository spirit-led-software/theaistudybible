import { indexRemoteFile } from '@revelationsai/server/services/scraper/file';
import { ApiHandler } from 'sst/node/api';
import {
  BadRequestResponse,
  OkResponse,
  InternalServerErrorResponse
} from '../../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  console.log('Received remote file download event:', event);

  const { name, url, metadata = '{}', dataSourceId } = JSON.parse(event.body || '{}');

  if (!name || !url) {
    return BadRequestResponse('Missing required fields');
  }

  try {
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
