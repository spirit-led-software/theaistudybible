import { upstashRedis } from './cache';
import constants from './constants';
import { database, upstashVectorIndex } from './database';
import { email, emailQueue } from './email';
import secrets from './secrets';
import {
  bibleBucket,
  cdn,
  devotionImagesBucket,
  generatedImagesBucket,
  profileImagesBucket,
} from './storage';

export const allLinks = [
  ...constants,
  ...secrets,
  email,
  emailQueue,
  bibleBucket,
  profileImagesBucket,
  generatedImagesBucket,
  devotionImagesBucket,
  database,
  upstashRedis,
  upstashVectorIndex,
  cdn,
];

/**
 * Define defaults for all SST functions
 */
$transform(sst.aws.Function, (args) => {
  // biome-ignore lint/suspicious/noExplicitAny: Don't care
  args.link = $output(args.link).apply((link: sst.Linkable<any>[] = []) =>
    Array.from(new Set([...link, ...allLinks])),
  );
  args.nodejs = $output(args.nodejs).apply((nodejs) => ({
    ...nodejs,
    install: Array.from(new Set([...(nodejs?.install || []), '@libsql/client'])),
  }));
});
