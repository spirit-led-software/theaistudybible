import * as vectorDb from "@/services/vector-db";
import { generateDevotion } from "@services/devotion";
import { CronJob } from "cron";

export async function register() {
  console.log("Initializing instrumentation");

  await vectorDb.initializeCollection();

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

  console.log("Instrumentation initialized");
}
