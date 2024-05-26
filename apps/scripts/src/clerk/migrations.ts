import { createClerkClient, type ClerkClient, type User } from '@clerk/clerk-sdk-node';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import ora, { type Ora } from 'ora';
import path from 'path';
import { z } from 'zod';

const userSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  password: z.string().optional(),
  passwordHasher: z
    .enum([
      'argon2i',
      'argon2id',
      'bcrypt',
      'md5',
      'pbkdf2_sha256',
      'pbkdf2_sha256_django',
      'pbkdf2_sha1',
      'scrypt_firebase'
    ])
    .optional()
});

type MigratedUser = z.infer<typeof userSchema>;

export async function generateClerkMigrationFile({
  databaseUrl,
  outputFile
}: {
  databaseUrl: string;
  outputFile?: string;
}) {
  const db = neon(databaseUrl);

  const usersWithPasswords =
    await db`SELECT users.id, users.email, users.name, user_passwords.password_hash, user_passwords.salt FROM users FULL JOIN user_passwords ON users.id = user_passwords.user_id;`;

  const migrationObjects: MigratedUser[] = usersWithPasswords.map((user) => {
    let passwordHash = undefined;
    if (user.password_hash) {
      passwordHash = user.password_hash;
    }

    let firstName = undefined;
    let lastName = undefined;
    if (user.name) {
      const nameParts = user.name.split(' ');
      firstName = nameParts[0];
      lastName = nameParts[1];
    }

    return {
      userId: user.id,
      email: user.email,
      firstName,
      lastName,
      password: passwordHash,
      passwordHasher: passwordHash ? 'argon2id' : undefined
    };
  });

  const migrationFile = JSON.stringify(migrationObjects, null, 2);

  outputFile = outputFile ? path.resolve(outputFile) : 'clerk-migration.json';
  fs.writeFileSync(outputFile, migrationFile);
}

export async function upsertUser(
  databaseUrl: string,
  userData: MigratedUser,
  clerkClient: ClerkClient
) {
  const existingUser = (
    await clerkClient.users.getUserList({
      externalId: [userData.userId]
    })
  ).data[0];

  let user: User | undefined = undefined;
  if (existingUser) {
    user = await clerkClient.users.updateUser(existingUser.id, {
      externalId: userData.userId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      skipPasswordChecks: true
    });
  } else {
    user =
      userData.password && userData.passwordHasher
        ? await clerkClient.users.createUser({
            externalId: userData.userId,
            emailAddress: [userData.email],
            firstName: userData.firstName,
            lastName: userData.lastName,
            passwordDigest: userData.password,
            passwordHasher: userData.passwordHasher
          })
        : await clerkClient.users.createUser({
            externalId: userData.userId,
            emailAddress: [userData.email],
            firstName: userData.firstName,
            lastName: userData.lastName,
            skipPasswordRequirement: true
          });
  }
  const db = neon(databaseUrl);
  await db`UPDATE users SET clerk_id = ${user.id} WHERE id = ${userData.userId};`;
  return user;
}

export async function runClerkMigration({
  clerkSecretKey,
  databaseUrl,
  delay = 1000,
  retryDelay = 10000,
  importToDev = false,
  offset = 0,
  inputFile = 'users.json'
}: {
  clerkSecretKey: string;
  databaseUrl: string;
  delay?: number;
  retryDelay?: number;
  importToDev?: boolean;
  offset?: number;
  inputFile?: string;
}) {
  const clerkClient = createClerkClient({
    secretKey: clerkSecretKey
  });

  if (clerkSecretKey.split('_')[1] !== 'live' && !importToDev) {
    throw new Error('The Clerk Secret Key provided is for a development instance.');
  }

  let migrated = 0;
  let alreadyExists = 0;

  async function processUserToClerk(userData: MigratedUser, spinner: Ora) {
    const txt = spinner.text;
    try {
      const parsedUserData = userSchema.safeParse(userData);
      if (!parsedUserData.success) {
        throw parsedUserData.error;
      }
      await upsertUser(databaseUrl, parsedUserData.data, clerkClient);

      migrated++;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error:', error);
      if (error.status === 422) {
        spinner.text = `${txt} - user already exists`;
        alreadyExists++;
        return;
      }

      // Keep cooldown in case rate limit is reached as a fallback if the thread blocking fails
      if (error.status === 429) {
        spinner.text = `${txt} - rate limit reached, waiting for ${retryDelay} ms`;
        await rateLimitCooldown();
        spinner.text = txt;
        return processUserToClerk(userData, spinner);
      }

      spinner.text = `${txt} - error: ${error.message}`;
    }
  }

  async function cooldown() {
    await new Promise((r) => setTimeout(r, delay));
  }

  async function rateLimitCooldown() {
    await new Promise((r) => setTimeout(r, retryDelay));
  }

  console.log(`Clerk User Migration Utility`);

  console.log(`Fetching users from ${inputFile}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsedUserData: any[] = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
  const offsetUsers = parsedUserData.slice(offset);
  console.log(`users.json found and parsed, attempting migration with an offset of ${offset}`);

  let i = 0;
  const spinner = ora(`Migrating users`).start();

  for (const userData of offsetUsers) {
    spinner.text = `Migrating user ${i}/${offsetUsers.length}, cooldown`;
    await cooldown();
    i++;
    spinner.text = `Migrating user ${i}/${offsetUsers.length}`;
    await processUserToClerk(userData, spinner);
  }

  spinner.succeed(`Migration complete`);

  console.log(`${migrated} users migrated`);
  console.log(`${alreadyExists} users failed to upload`);
}
