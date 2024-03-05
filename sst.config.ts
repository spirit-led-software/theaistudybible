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
  Jobs,
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
  async stacks(app) {
    app
      .stack(Constants)
      .stack(Layers)
      .stack(Database)
      .stack(Jobs)
      .stack(DatabaseScripts)
      .stack(S3)
      .stack(Queues)
      .stack(API)
      .stack(Auth)
      .stack(GraphQlApi)
      .stack(ChatAPI)
      .stack(RestAPI)
      .stack(AdminAPI)
      .stack(Website)
      .stack(CDN)
      .stack(Crons);
  }
} satisfies SSTConfig;
