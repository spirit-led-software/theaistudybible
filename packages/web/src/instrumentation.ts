import * as vectorDb from "@server/vector-db";
import { CronJob } from "cron";
import { websiteConfig } from "./configs";

export async function register() {
  console.log("Initializing instrumentation");

  await vectorDb.initializeCollection();

  new CronJob("0 10 * * * *", async () => {
    const response = await fetch(`${websiteConfig.url}/api/devos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.status !== 200) {
      console.error("Failed to create devo");
    }
  });

  console.log("Instrumentation initialized");
}
