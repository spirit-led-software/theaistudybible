import { generateDevotion } from '@theaistudybible/ai/devotion';
import { cache } from '@theaistudybible/core/cache';
import { Worker } from 'bullmq';

export const tasksWorker = new Worker(
  'tasks',
  async (job) => {
    try {
      switch (job.name) {
        case 'generate-devotion':
        case 'daily-devotion': {
          return await generateDevotion();
        }
        default: {
          console.log('Unknown task:', job.name);
          break;
        }
      }
    } catch (e) {
      console.error('Task failed:', e);
      throw e;
    }
  },
  {
    connection: cache
  }
);
