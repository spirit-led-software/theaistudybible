import {
  API,
  AdminAPI,
  Auth,
  Buckets,
  CDN,
  ChatAPI,
  Constants,
  Crons,
  Database,
  DatabaseScripts,
  GraphQlApi,
  Layers,
  Queues,
  RestAPI,
  Website,
} from "@revelationsai/infra";
import type { SSTConfig } from "sst";

export default {
  config() {
    return {
      name: "revelationsai",
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
      .stack(Auth)
      .stack(GraphQlApi)
      .stack(ChatAPI)
      .stack(RestAPI)
      .stack(AdminAPI)
      .stack(Website)
      .stack(Crons);
  },
} satisfies SSTConfig;
