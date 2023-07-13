import { generateDevotion } from "@services/devotion";
import { createInitialRoles } from "@services/role";
import { createInitialAdminUser } from "@services/user";
import * as vectorDb from "@services/vector-db";
import { CronJob } from "cron";
import { envConfig } from "./configs";

export async function register() {
  console.log("Initializing instrumentation");

  await vectorDb.initializeCollection();

  if (!envConfig.development) {
    console.log("Initializing cron jobs");
    const createDevoCron = new CronJob(
      "0 10 * * * *",
      () => {
        generateDevotion().catch((err) => {
          console.error("Failed to create devo", err);
        });
      },
      () => console.log("Create devo cron job completed"),
      false,
      "America/New_York"
    );
    createDevoCron.start();
    console.log("Cron jobs initialized");
  }

  await createInitialRoles();
  await createInitialAdminUser();

  console.log("Instrumentation initialized");
}
