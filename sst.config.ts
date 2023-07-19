import {
  API,
  Auth,
  Constants,
  Crons,
  Database,
  DatabaseMigrations,
  Layers,
  Queues,
  S3,
  Website,
} from "@stacks";
import { SSTConfig } from "sst";

export default {
  config(_input) {
    return {
      name: "revelationsai",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app
      .stack(Constants)
      .stack(Database)
      .stack(DatabaseMigrations)
      .stack(S3)
      .stack(Layers)
      .stack(Queues)
      .stack(API)
      .stack(Website)
      .stack(Auth)
      .stack(Crons);
  },
} satisfies SSTConfig;
