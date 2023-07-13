import { createInitialRoles } from "@services/role";
import { createInitialAdminUser } from "@services/user";
import * as vectorDb from "@services/vector-db";

export async function register() {
  console.log("Initializing instrumentation");

  await vectorDb.initializeCollection();

  await createInitialRoles();
  await createInitialAdminUser();

  console.log("Instrumentation initialized");
}
