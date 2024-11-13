import * as defaults from './defaults';

export const deadLetterQueue = new sst.aws.Queue('DeadLetterQueue');
deadLetterQueue.subscribe({
  handler: 'apps/functions/src/queues/subscribers/dead-letter.handler',
  copyFiles: defaults.copyFiles,
  runtime: defaults.runtime,
  nodejs: defaults.nodejs,
  memory: defaults.memory,
  timeout: defaults.timeout,
  environment: defaults.environment,
  link: defaults.link,
});
