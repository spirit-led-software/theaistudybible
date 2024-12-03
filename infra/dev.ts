import { allLinks } from './defaults';

export const drizzleStudio = new sst.x.DevCommand('DrizzleStudio', {
  link: allLinks,
  dev: { command: 'bun drizzle-kit studio', autostart: true },
});
