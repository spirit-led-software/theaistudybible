import * as constants from './constants';
import * as databases from './database';
import { email } from './email';
import * as queues from './queues';
import { Constant } from './resources';
import * as secrets from './secrets';
import * as storage from './storage';

export const allLinks = [
  ...Object.values(constants).filter((l) => l instanceof Constant),
  ...Object.values(secrets),
  ...Object.values(databases),
  ...Object.values(queues),
  ...Object.values(storage),
  email,
];

/**
 * Define defaults for all SST functions
 */
$transform(sst.aws.Function, (args) => {
  args.runtime = args.runtime ?? 'nodejs20.x';
  // biome-ignore lint/suspicious/noExplicitAny: Don't care
  args.link = $output(args.link).apply((link: sst.Linkable<any>[] = []) =>
    Array.from(new Set([...link, ...allLinks])),
  );
  args.nodejs = $output(args.nodejs).apply((nodejs) => ({
    ...nodejs,
    install: Array.from(new Set([...(nodejs?.install || []), '@libsql/client'])),
  }));
});
