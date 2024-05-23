import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getSessionClaimsFromEvent } from '@theaistudybible/functions/lib/user';
import { hasRole } from '@theaistudybible/server/lib/user';
import { ApiHandler } from 'sst/node/api';
import { Bucket } from 'sst/node/bucket';
import {
  BadRequestResponse,
  ForbiddenResponse,
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse
} from '../../lib/api-responses';

const s3Client = new S3Client({});

export const handler = ApiHandler(async (event) => {
  console.log('Received file upload url generation event:', event);

  const {
    name,
    url,
    fileName,
    fileType,
    metadata = '{}',
    dataSourceId
  } = JSON.parse(event.body || '{}');

  if (!name || !url || !fileName || !fileType || !dataSourceId) {
    return BadRequestResponse('Missing required fields');
  }

  try {
    const claims = await getSessionClaimsFromEvent(event);
    if (!claims) {
      return UnauthorizedResponse('Invalid token');
    }
    if (!hasRole('admin', claims)) {
      return ForbiddenResponse('User does not have permission to index files');
    }

    const s3Url = await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        ACL: 'public-read',
        ContentType: fileType,
        Bucket: Bucket.indexFileBucket.bucketName,
        Key: fileName,
        Metadata: {
          ...JSON.parse(metadata),
          dataSourceId,
          name,
          url
        }
      })
    );

    return OkResponse({
      url: s3Url
    });
  } catch (error) {
    console.error('Error generating file upload url:', error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
