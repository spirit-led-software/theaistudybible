import { verifyPassword } from '@revelationsai/core/util/password';
import { addRoleToUser } from '@revelationsai/server/services/role';
import { validApiHandlerSession } from '@revelationsai/server/services/session';
import { createUser, isAdminSync } from '@revelationsai/server/services/user';
import { createUserPassword } from '@revelationsai/server/services/user/password';
import { hash } from 'argon2';
import { randomBytes } from 'crypto';
import { ApiHandler } from 'sst/node/api';
import {
  BadRequestResponse,
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse
} from '../../../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  const { password, ...data } = JSON.parse(event.body ?? '{}');
  try {
    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid || !isAdminSync(userWithRoles)) {
      return UnauthorizedResponse();
    }

    if (password) {
      if (!verifyPassword(password)) {
        return BadRequestResponse(
          'Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 number, and 1 symbol.'
        );
      }
    }

    const user = await createUser(data);
    await addRoleToUser('user', user.id);

    if (password) {
      const salt = randomBytes(16).toString('hex');
      await createUserPassword({
        userId: user.id,
        passwordHash: await hash(`${password}${salt}`),
        salt: Buffer.from(salt, 'hex').toString('base64')
      });
    }

    return OkResponse(user);
  } catch (error) {
    console.error('Error creating user:', error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
