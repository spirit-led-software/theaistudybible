import { hashPassword } from '@/core/auth/providers/credentials/utils';
import { db } from '@/core/database';
import { passwords, roles, userCredits, users, usersToRoles } from '@/core/database/schema';
import { and, eq, sql } from 'drizzle-orm';
import { Resource } from 'sst';

async function createInitialAdminUser() {
  console.log('Creating initial admin user');

  const [admin] = await db
    .insert(users)
    .values({
      email: Resource.AdminEmail.value,
      firstName: 'Administrator',
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        firstName: sql`excluded.first_name`,
      },
    })
    .returning();

  const pwHash = await hashPassword(Resource.AdminPassword.value);

  const existingPassword = await db.query.passwords.findFirst({
    where: and(
      eq(passwords.userId, admin.id),
      eq(passwords.hash, pwHash),
      eq(passwords.active, true),
    ),
  });
  if (!existingPassword) {
    await db.update(passwords).set({ active: false }).where(eq(passwords.userId, admin.id));
    await db.insert(passwords).values({ userId: admin.id, hash: pwHash });
  }

  await db
    .insert(usersToRoles)
    .values({
      userId: admin.id,
      roleId: 'admin',
    })
    .onConflictDoNothing();

  console.log('Adding credits to admin user');
  await db
    .insert(userCredits)
    .values({
      userId: admin.id,
      balance: Number.MAX_SAFE_INTEGER / 2,
    })
    .onConflictDoUpdate({
      target: userCredits.userId,
      set: {
        balance: sql`excluded.balance`,
      },
    });

  console.log('Initial admin user created');
}

async function createInitialRoles() {
  console.log('Creating initial roles');

  console.log('Creating admin role');
  await db
    .insert(roles)
    .values({
      id: 'admin',
      name: 'Administrators',
    })
    .onConflictDoUpdate({
      target: roles.id,
      set: {
        name: sql`excluded.name`,
      },
    });
  console.log('Admin role created');

  console.log('Creating default user role');
  await db
    .insert(roles)
    .values({
      id: 'user',
      name: 'Users',
    })
    .onConflictDoUpdate({
      target: roles.id,
      set: {
        name: sql`excluded.name`,
      },
    })
    .returning();
  console.log('Default user role created');

  console.log('Initial roles created');
}

export const seedDatabase = async () => {
  try {
    console.log('Creating initial roles and users');
    await createInitialRoles();
    await createInitialAdminUser();

    console.log('Database seeding complete');
  } catch (e) {
    console.error('Database seeding failed:', e);
    throw e;
  }
};
