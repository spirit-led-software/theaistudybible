import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createBible } from './bibles/create';
import { clearClerkEnv } from './clerk/clear';
import { generateClerkMigrationFile, runClerkMigration } from './clerk/migrations';
import { runDatabaseMigrations } from './database/migrations';
import { seedDatabase } from './database/seed';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config({
  path: path.resolve(__dirname, '../.env')
});

// Load .env file in the root directory
dotenv.config({
  path: path.resolve(__dirname, '../../../.env')
});

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
  .command('clerk', 'Clerk commands', (yargs) =>
    yargs
      .command(
        'generate',
        'Generate the clerk migration json file. Described here: https://github.com/clerk/migration-script',
        (yargs) =>
          yargs
            .option('connection-url', {
              alias: 'u',
              type: 'string',
              description: 'Database connection URL'
            })
            .option('clerk-secret-key', {
              alias: 's',
              type: 'string',
              description: 'Clerk secret key'
            })
            .option('output-file', {
              alias: 'o',
              type: 'string',
              description: 'Path to output file'
            })
            .demandOption(['connection-url', 'clerk-secret-key']),
        (argv) => {
          generateClerkMigrationFile({
            databaseUrl: argv['connection-url'],
            outputFile: argv['output-file']
          });
        }
      )
      .command(
        'migrate',
        'Migrate users into clerk',
        (yargs) =>
          yargs
            .option('secret-key', {
              alias: 's',
              type: 'string',
              description: 'Clerk secret key'
            })
            .option('database-url', {
              alias: 'u',
              type: 'string',
              description: 'Database connection URL'
            })
            .option('input-file', {
              alias: 'i',
              type: 'string',
              description: 'Path to input file'
            })
            .option('allow-dev', {
              alias: 'd',
              type: 'boolean',
              description: 'Allow running in dev instance',
              default: false
            })
            .demandOption(['secret-key', 'database-url']),
        (argv) => {
          runClerkMigration({
            clerkSecretKey: argv['secret-key'],
            databaseUrl: argv['database-url'],
            importToDev: argv['allow-dev'],
            inputFile: argv['input-file']
          });
        }
      )
      .command(
        'clear',
        'Clear users from clerk',
        (yargs) =>
          yargs
            .option('secret-key', {
              alias: 's',
              type: 'string',
              description: 'Clerk secret key'
            })
            .option('allow-prod', {
              type: 'boolean',
              description: 'Allow running in prod instance',
              default: false
            })
            .demandOption(['secret-key']),
        (argv) => {
          clearClerkEnv({
            secretKey: argv['secret-key'],
            allowProd: argv['allow-prod']
          });
        }
      )
  )
  .command('bibles', 'Bible commands', (yargs) =>
    yargs.command(
      'create',
      'Create a new bible',
      (yargs) =>
        yargs
          .option('db-url', {
            alias: 'u',
            type: 'string',
            description: 'Database connection URL'
          })
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
          .option('openai-api-key', {
            alias: 'k',
            type: 'string',
            description: 'OpenAI API key'
          })
          .option('upstash-vector-url', {
            alias: 'v',
            type: 'string',
            description: 'Upstash vector URL'
          })
          .option('upstash-vector-token', {
            alias: 't',
            type: 'string',
            description: 'Upstash vector token'
          })
          .demandOption(['db-url', 'zip-path']),
      async (argv) => {
        await createBible({
          dbUrl: argv['db-url'],
          zipPath: argv['zip-path'],
          publicationId: argv['publication-id'],
          overwrite: argv['overwrite'],
          generateEmbeddings: argv['generate-embeddings'],
          embeddingModel: argv['embedding-model'],
          openaiApiKey: argv['openai-api-key'],
          upstashVectorUrl: argv['upstash-vector-url']
        });
      }
    )
  )
  .showHelpOnFail(true)
  .help('h')
  .alias('h', 'help')
  .parse();
