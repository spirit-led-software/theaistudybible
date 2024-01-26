import { verifyPassword } from '@revelationsai/core/util/password';
import { validApiHandlerSession } from '@revelationsai/server/services/session';
import {
  getUserPasswordByUserId,
  updateUserPassword
} from '@revelationsai/server/services/user/password';
import argon from 'argon2';
import { randomBytes } from 'crypto';
import { ApiHandler } from 'sst/node/api';
import {
  BadRequestResponse,
  UnauthorizedResponse,
  OkResponse,
  InternalServerErrorResponse
} from '../../../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  console.log('Received change password event:', event);

  const { currentPassword, newPassword } = JSON.parse(event.body ?? '{}');
  if (!currentPassword || !newPassword) {
    return BadRequestResponse('Missing currentPassword or newPassword');
  }

  try {
    const { isValid, userWithRoles } = await validApiHandlerSession();

    if (!isValid) {
      return UnauthorizedResponse();
    }

    const userPassword = await getUserPasswordByUserId(userWithRoles.id);

    const decodedSalt = Buffer.from(userPassword.salt, 'base64').toString('hex');
    const validPassword = await argon.verify(
      userPassword.passwordHash,
      `${currentPassword}${decodedSalt}`
    );
    if (!validPassword) {
      return UnauthorizedResponse('Previous password is incorrect.');
    }

    if (currentPassword === newPassword) {
      return BadRequestResponse('New password cannot be the same as the previous password');
    }

    if (!verifyPassword(newPassword)) {
      return BadRequestResponse(
        'Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 number, and 1 symbol.'
      );
    }

    const salt = randomBytes(16).toString('hex');
    await updateUserPassword(userPassword.id, {
      passwordHash: await argon.hash(`${newPassword}${salt}`),
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
