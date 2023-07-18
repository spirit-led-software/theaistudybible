import {
  API,
  Auth,
  Crons,
  Database,
  DatabaseMigrations,
  S3,
  Website,
} from "@stacks";
import { Queue } from "@stacks/Queue";
import { SSTConfig } from "sst";

export default {
  config(_input) {
    return {
      name: "chatesv",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app
      .stack(S3)
      .stack(Database)
      .stack(DatabaseMigrations)
      .stack(Queue)
      .stack(API)
      .stack(Website)
      .stack(Auth)
      .stack(Crons);
  },
} satisfies SSTConfig;
