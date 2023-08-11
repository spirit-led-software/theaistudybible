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
  async stacks(app) {
    app.stack(Constants);
    await app.stack(DatabaseScripts);
    app.stack(S3);
    app.stack(Queues);
    app.stack(Auth);
    app.stack(API);
    app.stack(Website);
    app.stack(Crons);
  },
} satisfies SSTConfig;
