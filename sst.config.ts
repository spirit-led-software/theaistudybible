import { API, Database, S3, Website } from "@stacks";
import { SSTConfig } from "sst";

export default {
  config(_input) {
    return {
      name: "chatesv",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(Database).stack(S3).stack(API).stack(Website);
  },
} satisfies SSTConfig;
