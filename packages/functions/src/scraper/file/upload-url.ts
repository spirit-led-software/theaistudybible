import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3Config from '@revelationsai/core/configs/s3';
import { validApiHandlerSession } from '@revelationsai/server/services/session';
import { isAdminSync } from '@revelationsai/server/services/user';
import { ApiHandler } from 'sst/node/api';
import {
  BadRequestResponse,
  UnauthorizedResponse,
  OkResponse,
  InternalServerErrorResponse
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
    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid || !isAdminSync(userWithRoles)) {
      return UnauthorizedResponse();
    }

    const s3Url = await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        ACL: 'public-read',
        ContentType: fileType,
        Bucket: s3Config.indexFileBucket,
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
