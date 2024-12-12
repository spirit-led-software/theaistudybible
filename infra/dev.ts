import { allLinks } from './defaults';

export const drizzleStudio = new sst.x.DevCommand('DrizzleStudio', {
  link: allLinks,
  dev: { command: 'bun drizzle-kit studio', autostart: true },
});

export const emailDev = new sst.x.DevCommand('EmailDev', {
  link: allLinks,
  dev: { directory: 'packages/email', command: 'bun dev', autostart: true },
});
