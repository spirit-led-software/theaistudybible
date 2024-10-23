import fs from 'node:fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

await yargs(hideBin(process.argv))
  .scriptName('scripts')
  .command(
    'upgrade',
    'Upgrade all packages',
    (yargs) => yargs,
    async () => {
      const { upgradePackages } = await import('./upgrade');
      await upgradePackages();
    },
  )
  .command('db', 'Database commands', (yargs) =>
    yargs.command(
      'seed',
      'Run database seeding',
      (yargs) => yargs,
      async () => {
        const { seedDatabase } = await import('./database/seed');
        await seedDatabase();
      },
    ),
  )
  .command('bibles', 'Bible commands', (yargs) =>
    yargs
      .command(
        'create',
        'Create a new bible',
        (yargs) =>
          yargs
            .option('zip-path', {
              alias: 'z',
              type: 'string',
              description: 'Path to the zip file containing the bible',
            })
            .option('publication-id', {
              alias: 'p',
              type: 'string',
              description: 'ID of the publication to use',
            })
            .option('overwrite', {
              alias: 'o',
              type: 'boolean',
              description: 'Overwrite existing bibles',
              default: false,
            })
            .option('generate-embeddings', {
              alias: 'e',
              type: 'boolean',
              description: 'Generate embeddings for the bible',
              default: false,
            })
            .demandOption(['zip-path']),
        async (argv) => {
          const { createBibleFromDblZip } = await import('@/core/utils/bibles/create-from-dbl-zip');
          const zipBuffer = fs.readFileSync(argv['zip-path']);
          await createBibleFromDblZip({
            zipBuffer,
            publicationId: argv['publication-id'],
            overwrite: argv.overwrite,
            generateEmbeddings: argv['generate-embeddings'],
          });
        },
      )
      .command(
        'remove-links',
        'Remove existing bible links between verses and chapters',
        (yargs) => yargs,
        async () => {
          const { removeBibleLinks } = await import('./one-off/remove-bible-links');
          await removeBibleLinks();
        },
      ),
  )
  .showHelpOnFail(true)
  .help('h')
  .alias('h', 'help')
  .parse();
