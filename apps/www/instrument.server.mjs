// @ts-check
/// <reference types="../../sst-env.d.ts" />

import * as Sentry from '@sentry/solidstart';
import { Resource } from 'sst';

Sentry.init({
  dsn: 'https://d05be7f6d9044060ebd25396600d21cf@o4507103632359424.ingest.us.sentry.io/4507974022266880',
  sampleRate: Resource.Stage.value === 'production' ? 1.0 : 0.1,
  environment: Resource.Stage.value,
  debug: Resource.Stage.value !== 'production',
});
