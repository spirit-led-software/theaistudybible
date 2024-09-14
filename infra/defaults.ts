import { upstashRedis } from './cache';
import constants from './constants';
import { database, upstashVectorIndex } from './database';
import secrets from './secrets';
import { bibleBucket, cdn, devotionImagesBucket, generatedImagesBucket } from './storage';

/**
 * Define defaults for all SST functions
 */
$transform(sst.aws.Function, (args) => {
  // biome-ignore lint/suspicious/noExplicitAny: Don't care
  args.link = $output(args.link).apply((link: sst.Linkable<any>[] = []) =>
    Array.from(
      new Set([
        ...link,
        ...constants,
        ...secrets,
        bibleBucket,
        generatedImagesBucket,
        devotionImagesBucket,
        database,
        upstashRedis,
        upstashVectorIndex,
        cdn,
      ]),
    ),
  );
});
