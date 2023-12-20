import databaseConfig from '@core/configs/database';
import vectorDBConfig from '@core/configs/vector-db';
import type { Handler } from 'aws-lambda';
import { Job } from 'sst/node/job';

export const handler: Handler = async (event) => {
  console.log('Recreating db indexes:', event);

  try {
    console.log('Starting hnsw index job');
    const jobId = await Job.hnswIndexJob.run({
      payload: {
        dbOptions: {
          readOnlyUrl: databaseConfig.readOnlyUrl,
          readWriteUrl: databaseConfig.readWriteUrl
        },
        vectorDbOptions: {
          readOnlyUrl: vectorDBConfig.readUrl,
          readWriteUrl: vectorDBConfig.writeUrl,
          recreateIndexes: true
        }
      }
    });
    console.log('Hnsw index job started:', jobId);
  } catch (e) {
    console.log("Couldn't recreate db indexes:", e);
    throw e;
  }
};
