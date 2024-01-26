import type { Handler } from 'aws-lambda';
import { Job } from 'sst/node/job';

export const handler: Handler = async (event) => {
  console.log('Recreating db indexes:', event);

  try {
    console.log('Starting hnsw index job');
    const jobId = await Job.hnswIndexJob.run({
      payload: {
        vectorDbOptions: {
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
