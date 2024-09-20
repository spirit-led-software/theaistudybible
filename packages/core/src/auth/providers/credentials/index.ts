import { lucia } from '@/core/auth';
import { AuthError } from '@/core/auth/errors';
import { db } from '@/core/database';
import { forgottenPasswordCodes, passwords, users } from '@/core/database/schema';
import { sqs } from '@/core/queues';
import type { EmailQueueRecord } from '@/functions/queues/subscribers/email/types';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { eq } from 'drizzle-orm';
import { Resource } from 'sst';
import type { z } from 'zod';
import { forgotPasswordSchema, resetPasswordSchema, signInSchema, signUpSchema } from './schemas';
import { generateSalt, hashPassword, verifyPassword } from './utils';

export async function signIn(credentials: z.infer<typeof signInSchema>) {
  const validated = await signInSchema.parseAsync(credentials);
  const existingUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, validated.email),
  });
  if (!existingUser) {
    throw new AuthError('InvalidSignIn', 'User not found');
  }

  const existingUserPassword = await db.query.passwords.findFirst({
    where: (passwords, { eq }) => eq(passwords.userId, existingUser.id),
  });
  if (!existingUserPassword) {
    throw new AuthError(
      'DifferentProvider',
      'A password does not exist for this user. Try signing in with a different provider.',
    );
  }

  const validPassword = verifyPassword(
    validated.password,
    existingUserPassword.salt,
    existingUserPassword.hash,
  );
  if (!validPassword) {
    throw new AuthError('InvalidSignIn', 'Invalid password');
  }

  const session = await lucia.createSession(existingUser.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);

  return sessionCookie;
}

export async function signUp(credentials: z.infer<typeof signUpSchema>) {
  const validated = await signUpSchema.parseAsync(credentials);
  const existingUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, validated.email),
  });
  if (existingUser) {
    throw new AuthError('EmailExists', 'A user with this email already exists');
  }

  const salt = generateSalt();
  const hash = hashPassword(validated.password, salt);
  const [user] = await db
    .insert(users)
    .values({
      email: validated.email,
    })
    .returning();
  await db.insert(passwords).values({
    userId: user.id,
    hash,
    salt,
  });

  const session = await lucia.createSession(user.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);

  return sessionCookie;
}

export async function requestPasswordReset(values: z.infer<typeof forgotPasswordSchema>) {
  const validated = await forgotPasswordSchema.parseAsync(values);

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, validated.email),
  });
  if (!user) {
    throw new AuthError('UserNotFound', 'User not found');
  }

  const [code] = await db
    .insert(forgottenPasswordCodes)
    .values({
      userId: user.id,
    })
    .returning();

  const result = await sqs.send(
    new SendMessageCommand({
      QueueUrl: Resource.EmailQueue.url,
      MessageBody: JSON.stringify({
        subject: 'Password Reset',
        to: [user.email],
        html: `<p>Click <a href="https://${Resource.Domain.value}/reset-password?code=${code.code}">here</a> to reset your password.</p>`,
      } satisfies EmailQueueRecord),
    }),
  );
  if (result.$metadata.httpStatusCode !== 200) {
    throw new Error('Failed to queue password reset email');
  }

  return code;
}

export async function resetPassword(values: z.infer<typeof resetPasswordSchema>) {
  const validated = await resetPasswordSchema.parseAsync(values);

  const code = await db.query.forgottenPasswordCodes.findFirst({
    where: (forgottenPasswordCodes, { eq }) => eq(forgottenPasswordCodes.code, validated.code),
  });

  if (!code || code.expiresAt < new Date()) {
    throw new AuthError('InvalidResetCode', 'Invalid reset code');
  }

  const salt = generateSalt();
  const hash = hashPassword(validated.password, salt);
  await db.update(passwords).set({ hash, salt }).where(eq(passwords.userId, code.userId));
}

export {
  newPasswordSchema,
  signInSchema,
  signUpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './schemas';
