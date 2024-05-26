import { createClerkClient } from '@clerk/clerk-sdk-node';
import { neon } from '@neondatabase/serverless';
import * as schema from '@theaistudybible/core/database/schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';

export async function seedDatabase({
  dbUrl,
  clerkSecretKey
}: {
  dbUrl: string;
  clerkSecretKey: string;
}) {
  const db = drizzle(neon(dbUrl), {
    schema,
    logger: {
      logQuery(query, params) {
        console.log('Executing query:', query, params);
      }
    }
  });

  const adminRole = await db.query.roles.findFirst({
    where: eq(schema.roles.id, 'admin')
  });
  if (adminRole) {
    await db
      .update(schema.roles)
      .set({
        name: 'Administrators',
        permissions: [`query:${Infinity}`, `image:${Infinity}`]
      })
      .where(eq(schema.roles.id, 'admin'));
  } else {
    await db.insert(schema.roles).values({
      id: 'admin',
      name: 'Administrators',
      permissions: [`query:${Infinity}`, `image:${Infinity}`]
    });
  }

  const userRole = await db.query.roles.findFirst({
    where: eq(schema.roles.id, 'user')
  });
  if (userRole) {
    await db
      .update(schema.roles)
      .set({
        name: 'Users',
        permissions: ['query:5', 'image:1']
      })
      .where(eq(schema.roles.id, 'admin'));
  } else {
    await db.insert(schema.roles).values({
      id: 'user',
      name: 'Users',
      permissions: ['query:5', `image:1`]
    });
  }

  const clerkClient = createClerkClient({
    secretKey: clerkSecretKey
  });
  const userCount = await clerkClient.users.getCount();
  console.log(`Seeding ${userCount} users`);
  const users = await clerkClient.users.getUserList({
    limit: userCount
  });
  await Promise.all(
    users.data.map(async (user) => {
      await clerkClient.users.updateUserMetadata(user.id, {
        publicMetadata: {
          ...user.publicMetadata,
          bibleTranslation: 'WEB',
          roles: Array.isArray(user.publicMetadata.roles)
            ? [
                ...user.publicMetadata.roles.filter((r) => typeof r === 'string' && r !== 'user'),
                'user'
              ]
            : ['user']
        }
      });
    })
  );

  console.log('Database seeding complete!');
}
