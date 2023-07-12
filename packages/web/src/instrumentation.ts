import { createInitialRoles } from "@services/role";
import { createInitialAdminUser } from "@services/user";

export async function register() {
  console.log("Initializing instrumentation");

  // await vectorDb.initializeCollection();

  // const createDevoCron = new CronJob(
  //   "0 10 * * * *",
  //   () => {
  //     generateDevotion().catch((err) => {
  //       console.error("Failed to create devo", err);
  //     });
  //   },
  //   () => console.log("Create devo cron job completed"),
  //   false,
  //   "America/New_York"
  // );
  // createDevoCron.start();

  await createInitialRoles();
  await createInitialAdminUser();

  console.log("Instrumentation initialized");
}
