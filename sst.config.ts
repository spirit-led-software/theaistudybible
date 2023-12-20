import {
  API,
  Auth,
  ChatAPI,
  Constants,
  Crons,
  Database,
  DatabaseScripts,
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
      .stack(Jobs)
      .stack(Database)
      .stack(DatabaseScripts)
      .stack(S3)
      .stack(Queues)
      .stack(API)
      .stack(Auth)
      .stack(ChatAPI)
      .stack(RestAPI)
      .stack(Website)
      .stack(Crons);
  }
} satisfies SSTConfig;
