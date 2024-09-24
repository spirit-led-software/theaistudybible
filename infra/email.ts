import { BASE_DOMAIN, DOMAIN } from './constants';

export const email =
  $app.stage === 'production'
    ? new sst.aws.Email('Email', {
        sender: DOMAIN.value,
        dns: sst.cloudflare.dns(),
      })
    : sst.aws.Email.get('Email', BASE_DOMAIN);

export const emailQueue = new sst.aws.Queue('EmailQueue', {
  fifo: true,
});
emailQueue.subscribe({
  handler: 'apps/functions/src/queues/subscribers/email/index.handler',
});
