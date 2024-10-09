import { cdn } from './cdn';
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
  ...Object.values(storage),
  cdn,
  ...Object.values(databases),
  ...Object.values(queues),
  email,
];

/**
 * Define defaults for all SST functions
 */
$transform(sst.aws.Function, (args) => {
  args.runtime ??= 'nodejs20.x';
  args.memory ??= '512 MB';
  // biome-ignore lint/suspicious/noExplicitAny: Don't care about the type
  args.link = $output(args.link).apply((links: sst.Linkable<any>[] = []) =>
    Array.from(new Set([...links, ...allLinks])),
  );
  args.nodejs = $output(args.nodejs).apply((nodejs) => ({
    ...nodejs,
    install: Array.from(new Set([...(nodejs?.install || []), '@libsql/client'])),
  }));
});
