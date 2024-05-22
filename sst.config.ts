import {
  API,
  Buckets,
  CDN,
  ChatAPI,
  Constants,
  Crons,
  Database,
  DatabaseScripts,
  Layers,
  Queues,
  Website,
} from "@theaistudybible/infra";
import type { SSTConfig } from "sst";

export default {
  config() {
    return {
      name: "theaistudybible",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app
      .stack(Constants)
      .stack(Layers)
      .stack(Database)
      .stack(DatabaseScripts)
      .stack(Buckets)
      .stack(CDN)
      .stack(Queues)
      .stack(API)
      .stack(ChatAPI)
      .stack(Website)
      .stack(Crons);
  },
} satisfies SSTConfig;
