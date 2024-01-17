import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3Config from '@core/configs/s3';
import {
  BadRequestResponse,
  InternalServerErrorResponse,
  NotFoundResponse,
  OkResponse,
  UnauthorizedResponse
} from '@lib/api-responses';
import { validApiHandlerSession } from '@services/session';
import { getUser, isAdminSync } from '@services/user';
import { ApiHandler } from 'sst/node/api';

const s3Client = new S3Client({});

export const handler = ApiHandler(async (event) => {
  console.log('Received profile picture url generation event:', event);
  const id = event.pathParameters!.id!;

  const { fileType } = JSON.parse(event.body || '{}');
  if (!fileType) {
    return BadRequestResponse('Missing fileType');
  }

  try {
    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid || !isAdminSync(userWithRoles)) {
      return UnauthorizedResponse();
    }

    const user = await getUser(id);
    if (!user) {
      return NotFoundResponse(`User with id '${id}' not found`);
    }

    const s3Url = await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        ACL: 'public-read',
        ContentType: fileType,
        Bucket: s3Config.userProfilePictureBucket,
        Key: `${user.id}-${Date.now()}`
      })
    );

    return OkResponse({
      url: s3Url
    });
  } catch (error) {
    console.error('Error generating profile picture url:', error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
