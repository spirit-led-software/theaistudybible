import { lucia } from '@/core/auth';
import { AuthError } from '@/core/auth/errors';
import { db } from '@/core/database';
import { forgottenPasswordCodes, passwords, users } from '@/core/database/schema';
import { eq } from 'drizzle-orm';
import type { z } from 'zod';
import { forgotPasswordSchema, resetPasswordSchema, signInSchema, signUpSchema } from './schemas';
import { hashPassword, verifyPassword } from './utils';

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

  const validPassword = await verifyPassword(existingUserPassword.hash, validated.password);
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

  const hash = await hashPassword(validated.password);
  const [user] = await db
    .insert(users)
    .values({
      email: validated.email,
    })
    .returning();
  await db.insert(passwords).values({
    userId: user.id,
    hash,
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

  const hash = await hashPassword(validated.password);
  await db.update(passwords).set({ hash }).where(eq(passwords.userId, code.userId));
}

export {
  newPasswordSchema,
  signInSchema,
  signUpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './schemas';
