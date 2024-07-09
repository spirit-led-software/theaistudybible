import { cache } from '@theaistudybible/core/cache';
import { Queue, Worker } from 'bullmq';
import { defineNitroPlugin } from 'nitropack/runtime';

cache.flushall();

export const tasksQueue = new Queue('tasks', {
  connection: cache
});

export const tasksWorker = new Worker(
  'tasks',
  async (job) => {
    console.log(JSON.stringify(job.data));
  },
  {
    connection: cache
  }
);

export default defineNitroPlugin(() => {
  console.log('Hello, World!');
});
