import { db } from '@/core/database';
import { roles } from '@/core/database/schema';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { Resource } from 'sst';

const clerk = createClerkClient({
  secretKey: Resource.ClerkSecretKey.value,
  publishableKey: Resource.ClerkPublishableKey.value,
});

async function createInitialAdminUser() {
  console.log('Creating initial admin user');
  let {
    data: [admin],
  } = await clerk.users.getUserList({
    emailAddress: [Resource.AdminEmail.value],
  });

  if (!admin) {
    admin = await clerk.users.createUser({
      emailAddress: [Resource.AdminEmail.value],
      password: Resource.AdminPassword.value,
      firstName: 'Administrator',
      skipPasswordChecks: true,
    });

    console.log('Initial admin user created');
  } else {
    console.log('Admin user already existed, updating password.');
    admin = await clerk.users.updateUser(admin.id, {
      password: Resource.AdminPassword.value,
      skipPasswordChecks: true,
    });
  }

  if (
    !admin.publicMetadata.roles ||
    !Array.isArray(admin.publicMetadata.roles) ||
    !admin.publicMetadata.roles.includes('admin')
  ) {
    console.log('Adding admin role to admin user');
    await clerk.users.updateUser(admin.id, {
      publicMetadata: {
        roles: ['admin'],
      },
    });
  }
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
      permissions: [`query:${Number.MAX_SAFE_INTEGER}`, `image:${Number.MAX_SAFE_INTEGER}`],
    })
    .onConflictDoUpdate({
      target: [roles.id],
      set: {
        name: 'Administrators',
        permissions: [`query:${Number.MAX_SAFE_INTEGER}`, `image:${Number.MAX_SAFE_INTEGER}`],
      },
    });
  console.log('Admin role created');

  console.log('Creating moderator role');
  await db
    .insert(roles)
    .values({
      id: 'moderator',
      name: 'Moderators',
      permissions: [`query:${Number.MAX_SAFE_INTEGER}`, `image:${Number.MAX_SAFE_INTEGER}`],
    })
    .onConflictDoUpdate({
      target: [roles.id],
      set: {
        name: 'Moderators',
        permissions: [`query:${Number.MAX_SAFE_INTEGER}`, `image:${Number.MAX_SAFE_INTEGER}`],
      },
    });
  console.log('Moderator role created');

  console.log('Creating default user role');
  await db
    .insert(roles)
    .values({
      id: 'user',
      name: 'Users',
      permissions: ['query:5', 'image:1'],
    })
    .onConflictDoUpdate({
      target: [roles.id],
      set: {
        name: 'Users',
        permissions: ['query:5', 'image:1'],
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
