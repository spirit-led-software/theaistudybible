import { SSTConfig } from "sst";
import { API, Database } from "./stacks";

export default {
  config(_input) {
    return {
      name: "chatesv",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(Database).stack(API);
  },
} satisfies SSTConfig;
