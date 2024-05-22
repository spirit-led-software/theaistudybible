import { indexWebCrawl } from '@theaistudybible/server/lib/scraper/web-crawl';
import { hasRole } from '@theaistudybible/server/lib/user';
import { ApiHandler } from 'sst/node/api';
import {
  BadRequestResponse,
  ForbiddenResponse,
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse
} from '../lib/api-responses';
import { getSessionClaimsFromEvent } from '../lib/user';

type RequestBody = {
  dataSourceId: string;
  url: string;
  pathRegex: string;
  name: string;
  metadata?: string;
};

export const handler = ApiHandler(async (event) => {
  console.log('Received web crawl event:', event);

  const claims = await getSessionClaimsFromEvent(event);
  if (!claims) {
    return UnauthorizedResponse('Invalid token');
  }
  if (!hasRole('admin', claims)) {
    return ForbiddenResponse('User does not have permission to index websites');
  }

  const {
    dataSourceId,
    url,
    pathRegex: pathRegexString,
    name,
    metadata = '{}'
  }: RequestBody = JSON.parse(event.body || '{}');

  if (!name || !url) {
    return BadRequestResponse('Name and url are required');
  }

  if (
    pathRegexString &&
    (pathRegexString.startsWith('/') ||
      pathRegexString.startsWith('\\/') ||
      pathRegexString.endsWith('/') ||
      pathRegexString.endsWith('\\/'))
  ) {
    return BadRequestResponse('Path regex cannot start or end with a forward slash');
  }

  try {
    const indexOp = await indexWebCrawl({
      dataSourceId,
      url,
      pathRegex: pathRegexString,
      name,
      metadata: JSON.parse(metadata)
    });

    return OkResponse({
      message: 'Website index operation started',
      indexOp
    });
  } catch (err) {
    console.error('Error indexing web crawl:', err);
    if (err instanceof Error) {
      return InternalServerErrorResponse(`${err.message}\n${err.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(err));
    }
  }
});
