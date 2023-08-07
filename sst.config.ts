import {
  API,
  Auth,
  Constants,
  Crons,
  DatabaseScripts,
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
      .stack(DatabaseScripts)
      .stack(S3)
      .stack(Queues)
      .stack(Auth)
      .stack(API)
      .stack(Website)
      .stack(Crons);
  },
} satisfies SSTConfig;
