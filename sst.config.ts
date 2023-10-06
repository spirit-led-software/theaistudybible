import {
  API,
  Auth,
  Constants,
  Crons,
  Database,
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
  async stacks(app) {
    app
      .stack(Constants)
      .stack(Database)
      .stack(S3)
      .stack(Queues)
      .stack(Auth)
      .stack(API)
      .stack(Website)
      .stack(Crons);
  },
} satisfies SSTConfig;
