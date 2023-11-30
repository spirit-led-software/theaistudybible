import { authConfig } from '@core/configs';
import type { User } from '@core/model';
import { users } from '@core/schema';
import type { Metadata } from '@core/types/metadata';
import {
  addRoleToUser,
  createRole,
  deleteRole,
  deleteStripeRoles,
  getRcRoles,
  getRoleByName,
  updateRole
} from '@services/role';
import { createUser, getUserByEmail, isAdmin, updateUser } from '@services/user';
import { getDocumentVectorStore } from '@services/vector-db';
import type { Handler } from 'aws-lambda';
import * as bcrypt from 'bcryptjs';
import { revenueCatConfig } from '../configs';

async function createInitialAdminUser() {
  console.log('Creating initial admin user');
  let adminUser: User | undefined = await getUserByEmail(authConfig.adminUser.email);
  if (!adminUser) {
    adminUser = await createUser({
      email: authConfig.adminUser.email,
      passwordHash: bcrypt.hashSync(authConfig.adminUser.password, authConfig.bcrypt.saltRounds)
    });
    console.log('Initial admin user created');
  } else {
    console.log('Admin user already existed, updating password.');
    adminUser = await updateUser(adminUser.id, {
      passwordHash: bcrypt.hashSync(authConfig.adminUser.password, authConfig.bcrypt.saltRounds)
    });
  }

  console.log('Adding admin role to admin user');
  await isAdmin(adminUser.id).then(async (isAdmin) => {
    if (!isAdmin) {
      await addRoleToUser('admin', adminUser!.id);
      console.log('Admin role added to admin user');
    } else {
      console.log('Admin role already added to admin user');
    }
  });
  console.log('Initial admin user created');
}

async function createInitialRoles() {
  console.log('Creating initial roles');

  console.log('Creating admin role');
  let adminRole = await getRoleByName('admin');
  if (!adminRole) {
    adminRole = await createRole({
      name: 'admin'
    });
    console.log('Admin role created');
  } else {
    adminRole = await updateRole(adminRole.id, {
      permissions: [`query:${Number.MAX_SAFE_INTEGER}`, `image:100`]
    });
    console.log('Admin role already exists');
  }

  console.log('Creating moderator role');
  let moderatorRole = await getRoleByName('moderator');
  if (!moderatorRole) {
    moderatorRole = await createRole({
      name: 'moderator'
    });
    console.log('Moderator role created');
  } else {
    moderatorRole = await updateRole(moderatorRole.id, {
      permissions: ['query:100', 'image:25']
    });
    console.log('Moderator role already exists');
  }

  console.log('Creating default user role');
  let userRole = await getRoleByName('user');
  if (!userRole) {
    userRole = await createRole({
      name: 'user'
    });
    console.log('Default user role created');
  } else {
    userRole = await updateRole(userRole.id, {
      permissions: ['query:5', 'image:1']
    });
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
  if (lookupKey === 'church-member') {
    return { queries: 10, images: 2 };
  } else if (lookupKey === 'youth-pastor') {
    return { queries: 25, images: 5 };
  } else if (lookupKey === 'lead-pastor') {
    return { queries: 50, images: 10 };
  } else if (lookupKey === 'church-plant') {
    return {
      queries: Number.MAX_SAFE_INTEGER,
      images: 50
    };
  } else {
    return { queries: 5, images: 1 };
  }
}

async function createRcEntitlementRoles() {
  const response = await fetch(
    `https://api.revenuecat.com/v2/projects/${revenueCatConfig.projectId}/entitlements?limit=25`,
    {
      headers: {
        Authorization: `Bearer ${revenueCatConfig.apiKey}`,
        Accept: 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`RevenueCat API error: ${response.status} ${response.statusText}`);
  }

  const entitlements: RCEntitlementsRootObject = await response.json();
  for (const entitlement of entitlements.items) {
    let role = await getRoleByName(`rc:${entitlement.lookup_key}`);
    const { queries, images } = getQueryCountFromEntitlementLookupKey(entitlement.lookup_key);
    if (!role) {
      role = await createRole({
        name: `rc:${entitlement.lookup_key}`,
        permissions: [`query:${queries}`, `image:${images}`]
      });
      console.log(`Role 'rc:${entitlement.lookup_key}' created`);
    } else {
      console.log(`Role 'rc:${entitlement.lookup_key}' already exists`);
      role = await updateRole(role.id, {
        permissions: [`query:${queries}`, `image:${images}`]
      });
    }
  }

  const existingRcRoles = await getRcRoles();
  for (const role of existingRcRoles) {
    if (!entitlements.items.find((e) => e.lookup_key === role.name.split(':')[1])) {
      console.log(`Role '${role.name}' no longer exists, deleting`);
      await deleteRole(role.id);
    }
  }
}

const getPartialHnswIndexInfos = () => {
  const infos: {
    name: string;
    filters: Metadata[];
  }[] = [];

  for (const translation of users.translation.enumValues) {
    infos.push(
      {
        name: `${translation.toLowerCase()}_bible`,
        filters: [
          {
            category: 'bible',
            translation
          }
        ]
      },
      {
        name: `${translation.toLowerCase()}_bible_qa`,
        filters: [
          {
            category: 'bible',
            translation
          },
          {
            category: 'commentary'
          }
        ]
      }
    );
  }

  infos.push(
    {
      name: 'theology_qa',
      filters: [
        {
          category: 'theology'
        },
        {
          category: 'commentary'
        }
      ]
    },
    {
      name: 'sermon_qa',
      filters: [
        {
          category: 'sermons'
        }
      ]
    }
  );

  return infos;
};

export const handler: Handler = async () => {
  try {
    console.log('Creating initial roles and users');
    await createInitialRoles();
    await createRcEntitlementRoles();
    await deleteStripeRoles();

    await createInitialAdminUser();

    console.log('Creating vector store and (re)creating HNSW index');
    const vectorDb = await getDocumentVectorStore();
    await vectorDb.ensureTableInDatabase();

    console.log('Creating partial HNSW indexes');
    await Promise.all(
      getPartialHnswIndexInfos().map(async ({ name, filters }) => {
        console.log(`Creating partial HNSW index on documents: ${name}`);
        const filteredVectorDb = await getDocumentVectorStore({
          filters
        });
        await filteredVectorDb.createPartialHnswIndex(name);
      })
    );

    // This code below should only be a one-off thing. Leaving it here just in case.
    // console.log("Creating chat memory vector stores and HNSW indexes");
    // const allChats = await getChats({
    //   limit: Number.MAX_SAFE_INTEGER,
    // });
    // const sliceSize = 50;
    // for (let i = 0; i < allChats.length; i + sliceSize) {
    //   const chatsSlice = allChats.slice(i, i + sliceSize);
    //   await Promise.all(
    //     chatsSlice.map(async (chat) => {
    //       const chatVectorDb = await getChatMemoryVectorStore(chat.id);
    //       await chatVectorDb.dropHnswIndex();
    //       await chatVectorDb.ensureTableInDatabase();
    //     })
    //   );
    // }

    console.log('Database seeding complete');
  } catch (e) {
    console.log(e);
    throw e;
  }
};
