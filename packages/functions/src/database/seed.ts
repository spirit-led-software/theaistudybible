import { authConfig } from "@core/configs";
import type { User } from "@core/model";
import {
  addRoleToUser,
  createRole,
  deleteRole,
  deleteStripeRoles,
  getRcRoles,
  getRoleByName,
  updateRole,
} from "@services/role";
import {
  createUser,
  getUserByEmail,
  isAdmin,
  updateUser,
} from "@services/user";
import { getDocumentVectorStore } from "@services/vector-db";
import type { Handler } from "aws-lambda";
import * as bcrypt from "bcryptjs";
import { revenueCatConfig } from "../configs";

async function createInitialAdminUser() {
  console.log("Creating initial admin user");
  let adminUser: User | undefined = await getUserByEmail(
    authConfig.adminUser.email
  );
  if (!adminUser) {
    adminUser = await createUser({
      email: authConfig.adminUser.email,
      passwordHash: bcrypt.hashSync(
        authConfig.adminUser.password,
        authConfig.bcrypt.saltRounds
      ),
    });
    console.log("Initial admin user created");
  } else {
    console.log("Admin user already existed, updating password.");
    adminUser = await updateUser(adminUser.id, {
      passwordHash: bcrypt.hashSync(
        authConfig.adminUser.password,
        authConfig.bcrypt.saltRounds
      ),
    });
  }

  console.log("Adding admin role to admin user");
  await isAdmin(adminUser.id).then(async (isAdmin) => {
    if (!isAdmin) {
      await addRoleToUser("admin", adminUser!.id);
      console.log("Admin role added to admin user");
    } else {
      console.log("Admin role already added to admin user");
    }
  });
  console.log("Initial admin user created");
}

async function createInitialRoles() {
  console.log("Creating initial roles");

  console.log("Creating admin role");
  let adminRole = await getRoleByName("admin");
  if (!adminRole) {
    adminRole = await createRole({
      name: "admin",
    });
    console.log("Admin role created");
  } else {
    adminRole = await updateRole(adminRole.id, {
      permissions: [
        `query:${Number.MAX_SAFE_INTEGER}`,
        `image:${Number.MAX_SAFE_INTEGER}`,
      ],
    });
    console.log("Admin role already exists");
  }

  console.log("Creating moderator role");
  let moderatorRole = await getRoleByName("moderator");
  if (!moderatorRole) {
    moderatorRole = await createRole({
      name: "moderator",
    });
    console.log("Moderator role created");
  } else {
    moderatorRole = await updateRole(moderatorRole.id, {
      permissions: ["query:500", "image:500"],
    });
    console.log("Moderator role already exists");
  }

  console.log("Creating default user role");
  let userRole = await getRoleByName("user");
  if (!userRole) {
    userRole = await createRole({
      name: "user",
    });
    console.log("Default user role created");
  } else {
    userRole = await updateRole(userRole.id, {
      permissions: ["query:5", "image:1"],
    });
    console.log("Default user role already exists");
  }

  console.log("Initial roles created");
}

type RCEntitlementsRootObject = {
  items: RCEntitlement[];
  next_page?: any;
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

function getQueryCountFromEntitlementLookupKey(lookupKey: string): number {
  if (lookupKey === "church-member") {
    return 10;
  } else if (lookupKey === "serve-staff") {
    return 25;
  } else if (lookupKey === "youth-pastor") {
    return 50;
  } else if (lookupKey === "worship-leader") {
    return 75;
  } else if (lookupKey === "lead-pastor") {
    return 100;
  } else if (lookupKey === "church-plant") {
    return Number.MAX_SAFE_INTEGER;
  } else {
    return 5;
  }
}

async function createRcEntitlementRoles() {
  const response = await fetch(
    `https://api.revenuecat.com/v2/projects/${revenueCatConfig.projectId}/entitlements?limit=25`,
    {
      headers: {
        Authorization: `Bearer ${revenueCatConfig.apiKey}`,
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `RevenueCat API error: ${response.status} ${response.statusText}`
    );
  }

  const entitlements: RCEntitlementsRootObject = await response.json();
  for (const entitlement of entitlements.items) {
    let role = await getRoleByName(`rc:${entitlement.lookup_key}`);
    if (!role) {
      role = await createRole({
        name: `rc:${entitlement.lookup_key}`,
        permissions: [
          `query:${getQueryCountFromEntitlementLookupKey(
            entitlement.lookup_key
          )}`,
        ],
      });
      console.log(`Role 'rc:${entitlement.lookup_key}' created`);
    } else {
      console.log(`Role 'rc:${entitlement.lookup_key}' already exists`);
      role = await updateRole(role.id, {
        permissions: [
          `query:${getQueryCountFromEntitlementLookupKey(
            entitlement.lookup_key
          )}`,
        ],
      });
    }
  }

  const existingRcRoles = await getRcRoles();
  for (const role of existingRcRoles) {
    if (
      !entitlements.items.find((e) => e.lookup_key === role.name.split(":")[1])
    ) {
      console.log(`Role '${role.name}' no longer exists, deleting`);
      await deleteRole(role.id);
    }
  }
}

export const handler: Handler = async () => {
  try {
    console.log("Creating initial roles and users");
    await createInitialRoles();
    await createRcEntitlementRoles();
    await deleteStripeRoles();

    await createInitialAdminUser();

    console.log("Creating vector store and (re)creating HNSW index");
    const vectorDb = await getDocumentVectorStore();
    await vectorDb.dropHnswIndex();
    await vectorDb.ensureTableInDatabase();

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

    console.log("Database seeding complete");
  } catch (e) {
    console.log(e);
    throw e;
  }
};
