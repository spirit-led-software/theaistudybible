import { CreateRoleData, Role, UpdateRoleData } from "@core/model";
import { roles, usersToRoles } from "@core/schema";
import { readOnlyDatabase, readWriteDatabase } from "@lib/database";
import { SQL, and, desc, eq, like } from "drizzle-orm";
import Stripe from "stripe";
import { stripeConfig } from "../configs";
import { getUserOrThrow } from "./user/user";

export async function getRoles(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const {
    where,
    limit = 25,
    offset = 0,
    orderBy = desc(roles.createdAt),
  } = options;

  return await readOnlyDatabase
    .select()
    .from(roles)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getRole(id: string) {
  return (
    await readOnlyDatabase.select().from(roles).where(eq(roles.id, id))
  ).at(0);
}

export async function getRoleOrThrow(id: string) {
  const role = await getRole(id);
  if (!role) {
    throw new Error(`Role with id ${id} not found`);
  }
  return role;
}

export async function getRoleByName(name: string) {
  return (
    await readOnlyDatabase.select().from(roles).where(eq(roles.name, name))
  ).at(0);
}

export async function getRoleByNameOrThrow(name: string) {
  const role = await getRoleByName(name);
  if (!role) {
    throw new Error(`Role with name ${name} not found`);
  }
  return role;
}

export async function createRole(data: CreateRoleData) {
  return (await readWriteDatabase.insert(roles).values(data).returning())[0];
}

export async function updateRole(id: string, data: UpdateRoleData) {
  return (
    await readWriteDatabase
      .update(roles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(roles.id, id))
      .returning()
  )[0];
}

export async function deleteRole(id: string) {
  return (
    await readWriteDatabase.delete(roles).where(eq(roles.id, id)).returning()
  )[0];
}

export async function addRoleToUser(roleName: string, userId: string) {
  const role = await getRoleByNameOrThrow(roleName);
  const user = await getUserOrThrow(userId);

  const userRolesRelation = await readOnlyDatabase
    .select()
    .from(usersToRoles)
    .where(eq(usersToRoles.userId, userId));

  const userRoles: Role[] = [];
  for (const userRoleRelation of userRolesRelation) {
    const userRole = (
      await readOnlyDatabase
        .select()
        .from(roles)
        .where(eq(roles.id, userRoleRelation.roleId))
    )[0];
    userRoles.push(userRole);
  }

  if (userRoles.some((r) => r.id === role.id)) {
    throw new Error(`User already has role ${roleName}`);
  }

  await readWriteDatabase.insert(usersToRoles).values({
    userId: user.id,
    roleId: role.id,
  });

  return {
    user,
    role,
  };
}

export async function removeRoleFromUser(roleName: string, userId: string) {
  const role = await getRoleByNameOrThrow(roleName);
  const user = await getUserOrThrow(userId);

  const userRoleRelation = (
    await readOnlyDatabase
      .select()
      .from(usersToRoles)
      .where(
        and(eq(usersToRoles.userId, user.id), eq(usersToRoles.roleId, role.id))
      )
  )[0];

  if (!userRoleRelation) {
    throw new Error(`User does not have role ${roleName}`);
  }

  await readWriteDatabase
    .delete(usersToRoles)
    .where(
      and(eq(usersToRoles.userId, user.id), eq(usersToRoles.roleId, role.id))
    );
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
    console.log("Default user role already exists");
  }

  console.log("Initial roles created");
}

export async function createStripeRoles() {
  const stripe = require("stripe")(stripeConfig.apiKey) as Stripe;

  console.log("Creating stripe roles");

  const productsResponse = await stripe.products.list();
  const products = productsResponse.data;

  for (const product of products) {
    const productRole = await getRoleByName(product.name);
    if (!productRole) {
      await createRole({
        name: `stripe:${product.name}`,
        permissions: [`query:${product.metadata.queryCount}`],
      });
      console.log(`Created role ${product.name}`);
    } else {
      console.log(`Role ${product.name} already exists`);
    }
  }

  const existingRoles = await getStripeRoles();
  for (const existingRole of existingRoles) {
    const product = products.find(
      (p) => p.name === existingRole.name.split(":")[1]
    );
    if (!product) {
      await deleteRole(existingRole.id);
      console.log(`Deleted role ${existingRole.name}`);
    }
  }
}

export async function getStripeRoles() {
  return await getRoles({
    where: like(roles.name, "stripe:%"),
  });
}
