import { readdirSync } from 'node:fs';
import { $ } from 'bun';

export const upgradePackages = async () => {
  const apps = readdirSync('./apps', { withFileTypes: true }).filter((d) => d.isDirectory());
  for (const a of apps) {
    console.log(`Upgrading apps/${a.name}...`);
    await $`cd apps/${a.name} && bun update --latest --save`;
  }

  const packages = readdirSync('./packages', { withFileTypes: true }).filter((d) =>
    d.isDirectory(),
  );
  for (const p of packages) {
    console.log(`Upgrading packages/${p.name}...`);
    await $`cd packages/${p.name} && bun update --latest --save`;
  }

  const tools = readdirSync('./tools', { withFileTypes: true }).filter((d) => d.isDirectory());
  for (const t of tools) {
    console.log(`Upgrading tools/${t.name}...`);
    await $`cd tools/${t.name} && bun update --latest --save`;
  }

  console.log('Upgrading root...');
  await $`bun update --latest --save`;

  console.log('Running clean install...');
  await $`bun run clean-install`;

  console.log('Done!');
};
