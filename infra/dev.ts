import { allLinks } from './defaults';

export const drizzleStudio = new sst.x.DevCommand('DrizzleStudio', {
  link: allLinks,
  dev: { command: 'pnpm drizzle-kit studio', autostart: true },
});

export const emailDev = new sst.x.DevCommand('EmailDev', {
  link: allLinks,
  dev: { directory: 'packages/email', command: 'pnpm dev', autostart: true },
});
