const globalForHasRunInstrumentation = globalThis as unknown as {
  ranInstrumentation: boolean | undefined;
};

export async function register() {
  if (globalForHasRunInstrumentation.ranInstrumentation) {
    console.log("Instrumentation already ran on this machine");
    return;
  }

  console.log("Initializing instrumentation");

  const vectorDbService = await import("@chatesv/core/services/vector-db");
  await vectorDbService.initializeCollection();

  const roleService = await import("@chatesv/core/services/role");
  await roleService.createInitialRoles();

  const userService = await import("@chatesv/core/services/user");
  await userService.createInitialAdminUser();

  console.log("Instrumentation initialized");

  globalForHasRunInstrumentation.ranInstrumentation = true;
}
