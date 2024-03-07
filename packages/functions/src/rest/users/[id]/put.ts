import { updateUserSchema } from '@revelationsai/core/model/user';
import { validApiHandlerSession } from '@revelationsai/server/services/session';
import { getUser, updateUser } from '@revelationsai/server/services/user';
import { ApiHandler } from 'sst/node/api';
import { Bucket } from 'sst/node/bucket';
import { Config } from 'sst/node/config';
import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse
} from '../../../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  const data = JSON.parse(event.body ?? '{}');

  try {
    const values = updateUserSchema.parse(data);

    let user = await getUser(id);
    if (!user) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid || user.id !== userWithRoles.id) {
      return UnauthorizedResponse('You are not authorized to update this user');
    }

    // if the user is updating their image with an image from within our bucket, use the CDN if it exists
    if (
      values.image &&
      values.image.toLowerCase().includes(Bucket.PublicBucket.bucketName.toLowerCase()) &&
      // @ts-expect-error - this may not be defined in non-prod-envs
      Config.CDN_URL
    ) {
      const imageUrl = new URL(values.image);
      // @ts-expect-error - this may not be defined in non-prod-envs
      values.image = `${Config.CDN_URL}${imageUrl.pathname}`;
    }

    user = await updateUser(user.id, values);
    return OkResponse(user);
  } catch (error) {
    console.error(`Error updating user '${id}':`, error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
