import { cache } from '@theaistudybible/core/cache';
import { Queue } from 'bullmq';

export const tasksQueue = new Queue('tasks', {
  connection: cache
});
