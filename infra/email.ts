import { DOMAIN } from './constants';

export const email = new sst.aws.Email('Email', {
  sender: DOMAIN.properties.value,
  dns: sst.cloudflare.dns(),
});

export const emailQueue = new sst.aws.Queue('EmailQueue', {
  fifo: true,
});
emailQueue.subscribe({
  handler: 'apps/functions/src/queues/subscribers/email/index.handler',
});