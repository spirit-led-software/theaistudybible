import fs from 'node:fs';
import { createBibleFromDblZip } from '@/core/utils/bibles/create-from-dbl-zip';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { seedDatabase } from './database/seed';
import { upgradePackages } from './upgrade';

await yargs(hideBin(process.argv))
  .scriptName('scripts')
  .command(
    'upgrade',
    'Upgrade all packages',
    (yargs) => yargs,
    async () => {
      await upgradePackages();
    },
  )
  .command('db', 'Database commands', (yargs) =>
    yargs.command(
      'seed',
      'Run database seeding',
      (yargs) => yargs,
      async () => {
        await seedDatabase();
      },
    ),
  )
  .command('bibles', 'Bible commands', (yargs) =>
    yargs.command(
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
        const zipBuffer = fs.readFileSync(argv['zip-path']);
        await createBibleFromDblZip({
          zipBuffer,
          publicationId: argv['publication-id'],
          overwrite: argv.overwrite,
          generateEmbeddings: argv['generate-embeddings'],
        });
      },
    ),
  )
  .showHelpOnFail(true)
  .help('h')
  .alias('h', 'help')
  .parse();
