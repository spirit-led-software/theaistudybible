import {
  BadRequestResponse,
  InternalServerErrorResponse,
  NotFoundResponse,
  OkResponse,
  UnauthorizedResponse
} from '@lib/api-responses';
import { verifyPassword } from '@lib/util/password';
import { validApiHandlerSession } from '@services/session';
import { getUser, isAdminSync } from '@services/user';
import { getUserPasswordByUserId, updateUserPassword } from '@services/user/password';
import argon from 'argon2';
import { randomBytes } from 'crypto';
import { ApiHandler } from 'sst/node/api';

export const handler = ApiHandler(async (event) => {
  console.log('Received change password event:', event);
  const id = event.pathParameters!.id!;

  const { password } = JSON.parse(event.body ?? '{}');

  try {
    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid || !isAdminSync(userWithRoles)) {
      return UnauthorizedResponse();
    }

    const user = await getUser(id);
    if (!user) {
      return NotFoundResponse(`User with id ${id} not found.`);
    }

    const userPassword = await getUserPasswordByUserId(user.id);

    if (!verifyPassword(password)) {
      return BadRequestResponse(
        'Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 number, and 1 symbol.'
      );
    }

    const salt = randomBytes(16).toString('hex');
    await updateUserPassword(userPassword.id, {
      passwordHash: await argon.hash(`${password}${salt}`),
      salt: Buffer.from(salt, 'hex').toString('base64')
    });

    return OkResponse({
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
