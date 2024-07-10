import { generateDevotion } from '@theaistudybible/ai/devotion';
import { cache } from '@theaistudybible/core/cache';
import { Worker } from 'bullmq';

export const tasksWorker = new Worker(
  'tasks',
  async (job) => {
    switch (job.name) {
      case 'daily-devotion': {
        return await generateDevotion();
      }
      default: {
        console.log('Unknown task:', job.name);
        break;
      }
    }
  },
  {
    connection: cache
  }
);
