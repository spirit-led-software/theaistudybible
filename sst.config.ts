import {
  API,
  AdminAPI,
  Auth,
  CDN,
  ChatAPI,
  Constants,
  Crons,
  Database,
  DatabaseScripts,
  GraphQlApi,
  Layers,
  Queues,
  S3,
  Website
} from '@stacks';
import type { SSTConfig } from 'sst';
import { RestAPI } from './stacks/Rest-API';

export default {
  config() {
    return {
      name: 'revelationsai',
      region: 'us-east-1'
    };
  },
  stacks(app) {
    app
      .stack(Constants)
      .stack(Layers)
      .stack(Database)
      .stack(DatabaseScripts)
      .stack(S3)
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
  }
} satisfies SSTConfig;
