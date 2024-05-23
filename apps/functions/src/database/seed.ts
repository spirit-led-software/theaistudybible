import { createClerkClient } from '@clerk/clerk-sdk-node';
import { roles } from '@theaistudybible/core/database/schema';
import { db } from '@theaistudybible/server/lib/database';
import type { Handler } from 'aws-lambda';
import { eq } from 'drizzle-orm';

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.PUBLIC_CLERK_PUBLISHABLE_KEY
});

async function createInitialAdminUser() {
  console.log('Creating initial admin user');
  let {
    data: [admin]
  } = await clerk.users.getUserList({
    emailAddress: [process.env.ADMIN_EMAIL]
  });

  if (!admin) {
    admin = await clerk.users.createUser({
      emailAddress: [process.env.ADMIN_EMAIL],
      password: process.env.ADMIN_PASSWORD,
      firstName: 'Administrator',
      skipPasswordChecks: true
    });

    console.log('Initial admin user created');
  } else {
    console.log('Admin user already existed, updating password.');
    admin = await clerk.users.updateUser(admin.id, {
      password: process.env.ADMIN_PASSWORD,
      skipPasswordChecks: true
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
        roles: ['admin']
      }
    });
  }
  console.log('Initial admin user created');
}

async function createInitialRoles() {
  console.log('Creating initial roles');

  console.log('Creating admin role');
  let adminRole = await db.query.roles.findFirst({
    where: (roles, { eq }) => eq(roles.id, 'admin')
  });
  if (!adminRole) {
    [adminRole] = await db
      .insert(roles)
      .values({
        id: 'admin',
        name: 'Administrators',
        permissions: [`query:${Number.MAX_SAFE_INTEGER}`, `image:${Number.MAX_SAFE_INTEGER}`]
      })
      .returning();
    console.log('Admin role created');
  } else {
    console.log(`Admin role already exists, updating permissions. ${JSON.stringify(adminRole)}`);
    [adminRole] = await db
      .update(roles)
      .set({
        permissions: [`query:${Number.MAX_SAFE_INTEGER}`, `image:${Number.MAX_SAFE_INTEGER}`]
      })
      .where(eq(roles.id, 'admin'))
      .returning();
  }

  console.log('Creating moderator role');
  let moderatorRole = await db.query.roles.findFirst({
    where: (roles, { eq }) => eq(roles.id, 'moderator')
  });
  if (!moderatorRole) {
    [moderatorRole] = await db
      .insert(roles)
      .values({
        id: 'moderator',
        name: 'Moderators'
      })
      .returning();
    console.log('Moderator role created');
  } else {
    [moderatorRole] = await db
      .update(roles)
      .set({
        permissions: [`query:${Number.MAX_SAFE_INTEGER}`, `image:${Number.MAX_SAFE_INTEGER}`]
      })
      .where(eq(roles.id, 'moderator'))
      .returning();
    console.log('Moderator role already exists');
  }

  console.log('Creating default user role');
  let userRole = await db.query.roles.findFirst({
    where: (roles, { eq }) => eq(roles.id, 'user')
  });
  if (!userRole) {
    [userRole] = await db
      .insert(roles)
      .values({
        id: 'user',
        name: 'Users'
      })
      .returning();
    console.log('Default user role created');
  } else {
    [userRole] = await db
      .update(roles)
      .set({
        permissions: ['query:5', 'image:1']
      })
      .where(eq(roles.id, 'user'))
      .returning();
    console.log('Default user role already exists');
  }

  console.log('Initial roles created');
}

type RCEntitlementsRootObject = {
  items: RCEntitlement[];
  next_page?: unknown;
  object: string;
  url: string;
};

type RCEntitlement = {
  created_at: number;
  display_name: string;
  id: string;
  lookup_key: string;
  object: string;
  project_id: string;
};

function getQueryCountFromEntitlementLookupKey(lookupKey: string): {
  queries: number;
  images: number;
} {
  if (lookupKey === 'plus') {
    return {
      queries: Number.MAX_SAFE_INTEGER,
      images: Number.MAX_SAFE_INTEGER
    };
  } else {
    return { queries: 5, images: 1 };
  }
}

async function createRcEntitlementRoles() {
  const response = await fetch(
    `https://api.revenuecat.com/v2/projects/${process.env.REVENUECAT_PROJECT_ID}/entitlements?limit=25`,
    {
      headers: {
        Authorization: `Bearer ${process.env.REVENUECAT_API_KEY}`,
        Accept: 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`RevenueCat API error: ${response.status} ${response.statusText}`);
  }

  const entitlements: RCEntitlementsRootObject = await response.json();
  for (const entitlement of entitlements.items) {
    let role = await db.query.roles.findFirst({
      where: (roles, { eq }) => eq(roles.id, `rc:${entitlement.lookup_key}`)
    });
    const { queries, images } = getQueryCountFromEntitlementLookupKey(entitlement.lookup_key);
    if (!role) {
      [role] = await db
        .insert(roles)
        .values({
          id: `rc:${entitlement.lookup_key}`,
          name: `RevenueCat ${entitlement.display_name}`,
          permissions: [`query:${queries}`, `image:${images}`]
        })
        .returning();
      console.log(`Role 'rc:${entitlement.lookup_key}' created`);
    } else {
      console.log(`Role 'rc:${entitlement.lookup_key}' already exists`);
      [role] = await db
        .update(roles)
        .set({
          permissions: [`query:${queries}`, `image:${images}`]
        })
        .where(eq(roles.id, role.id))
        .returning();
    }
  }

  const existingRcRoles = await db.query.roles.findMany({
    where: (roles, { ilike }) => ilike(roles.id, 'rc:%')
  });
  for (const role of existingRcRoles) {
    if (!entitlements.items.find((e) => e.lookup_key === role.name.split(':')[1])) {
      console.log(`Role '${role.name}' no longer exists, deleting`);
      await db.delete(roles).where(eq(roles.id, role.id));
    }
  }
}

export const handler: Handler = async () => {
  try {
    console.log('Creating initial roles and users');
    await createInitialRoles();
    await createRcEntitlementRoles();
    await createInitialAdminUser();

    console.log('Database seeding complete');
  } catch (e) {
    console.error('Database seeding failed:', e);
    throw e;
  }
};
