import { ANALYTICS_URL } from '../analytics';
import { cdn } from '../cdn';
import * as constants from '../constants';
import * as databases from '../database';
import { email } from '../email';
import * as queues from '../queues';
import { Constant } from '../resources';
import * as secrets from '../secrets';
import * as storage from '../storage';
import { WEBHOOKS_URL } from '../webhooks';

// biome-ignore lint/suspicious/noExplicitAny: Don't care
export function isLinkable(obj: any): obj is sst.Linkable<any> {
  return 'getSSTLink' in obj;
}

// biome-ignore lint/suspicious/noExplicitAny: Don't care
export function buildLinks(links: any[]) {
  return links
    .map((link) => {
      if (!link) {
        throw new Error('An undefined link was passed into a `link` array.');
      }
      return link;
    })
    .filter((l) => isLinkable(l))
    .map((l) => {
      const link = l.getSSTLink();
      return $util.all([l.urn, link]).apply(([urn, link]) => ({
        name: urn.split('::').at(-1)!,
        properties: {
          ...link.properties,
          type: urn.split('::').at(-2),
        },
      }));
    });
}

export const allLinks = [
  ...Object.values(constants).filter((l) => l instanceof Constant),
  ANALYTICS_URL,
  WEBHOOKS_URL,
  ...Object.values(secrets),
  ...Object.values(storage),
  cdn,
  ...Object.values(databases),
  ...Object.values(queues),
  email,
];
