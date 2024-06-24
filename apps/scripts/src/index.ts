import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createBible } from './bibles/create';
import { runDatabaseMigrations } from './database/migrations';
import { seedDatabase } from './database/seed';

yargs(hideBin(process.argv))
  .scriptName('scripts')
  .command('db', 'Database commands', (yargs) =>
    yargs
      .command(
        'migrate',
        'Run database migrations',
        (yargs) => yargs,
        () => {
          runDatabaseMigrations();
        }
      )
      .command(
        'seed',
        'Run database seeding',
        (yargs) => yargs,
        () => {
          seedDatabase();
        }
      )
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
            description: 'Path to the zip file containing the bible'
          })
          .option('publication-id', {
            alias: 'p',
            type: 'string',
            description: 'ID of the publication to use'
          })
          .option('overwrite', {
            alias: 'o',
            type: 'boolean',
            description: 'Overwrite existing bibles',
            default: false
          })
          .option('generate-embeddings', {
            alias: 'e',
            type: 'boolean',
            description: 'Generate embeddings for the bible',
            default: false
          })
          .option('embedding-model', {
            alias: 'm',
            type: 'string',
            description: 'Embedding model to use'
          })
          .demandOption(['zip-path']),
      async (argv) => {
        await createBible({
          zipPath: argv['zip-path'],
          publicationId: argv['publication-id'],
          overwrite: argv['overwrite'],
          generateEmbeddings: argv['generate-embeddings'],
          embeddingModel: argv['embedding-model']
        });
      }
    )
  )
  .showHelpOnFail(true)
  .help('h')
  .alias('h', 'help')
  .parse();
