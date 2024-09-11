import { upstashRedis } from './cache';
import constants from './constants';
import { database, upstashVectorIndex } from './database';
import secrets from './secrets';
import { bibleBucket, cdn, generatedImagesBucket } from './storage';

/**
 * Define defaults for all SST functions
 */
$transform(sst.aws.Function, (args) => {
  // biome-ignore lint/suspicious/noExplicitAny: Don't care
  args.link = $output(args.link).apply((link: sst.Linkable<any>[] = []) => [
    ...link,
    ...constants,
    ...secrets,
    bibleBucket,
    generatedImagesBucket,
    database,
    upstashRedis,
    upstashVectorIndex,
    cdn,
  ]);
  args.nodejs = $output(args.nodejs).apply((nodejs = {}) => ({
    ...nodejs,
    install: [...(nodejs.install || []), '@libsql/client'],
    esbuild: {
      ...nodejs.esbuild,
      external: [...(nodejs.esbuild?.external || []), '@libsql/client'],
    },
  }));
});
