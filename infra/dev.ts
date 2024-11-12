import { database } from './database';

export const drizzleStudio = new sst.x.DevCommand('DrizzleStudio', {
  link: [database],
  dev: { command: 'bun drizzle-kit studio', autostart: true },
});
