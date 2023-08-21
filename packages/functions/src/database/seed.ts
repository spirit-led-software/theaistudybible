import { authConfig } from "@core/configs";
import { User } from "@core/model";
import {
  addRoleToUser,
  createRole,
  deleteRole,
  getRoleByName,
  getStripeRoles,
  updateRole,
} from "@services/role";
import {
  createUser,
  getUserByEmail,
  isAdmin,
  updateUser,
} from "@services/user";
import { getDocumentVectorStore } from "@services/vector-db";
import { Handler } from "aws-lambda";
import * as bcrypt from "bcryptjs";
import Stripe from "stripe";
import { stripeConfig } from "../configs";

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

export async function createInitialRoles() {
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
      permissions: ["query:10000"],
    });
    console.log("Admin role already exists");
  }

  console.log("Creating moderator role");
  let moderatorRole = await getRoleByName("user");
  if (!moderatorRole) {
    moderatorRole = await createRole({
      name: "user",
    });
    console.log("Moderator role created");
  } else {
    moderatorRole = await updateRole(moderatorRole.id, {
      permissions: ["query:10000"],
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
      permissions: ["query:10"],
    });
    console.log("Default user role already exists");
  }

  console.log("Initial roles created");
}

export async function createStripeRoles() {
  const stripe = new Stripe(stripeConfig.apiKey, { apiVersion: "2023-08-16" });

  console.log("Creating stripe roles");

  const productsResponse = await stripe.products.list({
    active: true,
  });
  const products = productsResponse.data;

  for (const product of products) {
    const productRole = await getRoleByName(`stripe:${product.id}`);
    if (!productRole) {
      const role = await createRole({
        name: `stripe:${product.id}`,
        permissions: [`query:${product.metadata.queryLimit}`],
      });
      console.log(`Created role ${role.name}`);
    } else {
      console.log(`Role stripe:${product.id} already exists`);
    }
  }

  const existingRoles = await getStripeRoles();
  for (const existingRole of existingRoles) {
    const product = products.find(
      (p) => p.id === existingRole.name.split(":")[1]
    );
    if (!product) {
      await deleteRole(existingRole.id);
      console.log(`Deleted role ${existingRole.name}`);
    }
  }
}

export const handler: Handler = async () => {
  try {
    console.log("Creating initial roles and users");
    await createInitialRoles();
    await createStripeRoles();
    await createInitialAdminUser();

    console.log("Creating vector store");
    const vectorDb = await getDocumentVectorStore(true);
    await vectorDb.ensureTableInDatabase();

    console.log("Database seeding complete");
  } catch (e) {
    console.log(e);
    throw e;
  }
};
