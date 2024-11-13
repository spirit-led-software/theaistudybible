import { BASE_DOMAIN, DOMAIN, isProd } from './constants';
import * as defaults from './defaults';
import { deadLetterQueue } from './dlq';

export const email = isProd
  ? new sst.aws.Email('Email', { sender: DOMAIN.value, dns: sst.aws.dns() })
  : sst.aws.Email.get('Email', BASE_DOMAIN);

export const emailQueue = new sst.aws.Queue('EmailQueue', {
  dlq: { queue: deadLetterQueue.arn, retry: 3 },
});
emailQueue.subscribe(
  {
    handler: 'apps/functions/src/queues/subscribers/email/index.handler',
    copyFiles: defaults.copyFiles,
    runtime: defaults.runtime,
    nodejs: defaults.nodejs,
    memory: '2 GB',
    timeout: defaults.timeout,
    environment: defaults.environment,
    link: defaults.link,
  },
  { batch: { partialResponses: true } },
);
