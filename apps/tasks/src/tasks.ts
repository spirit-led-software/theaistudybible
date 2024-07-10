import { tasksQueue } from './queues';

if (process.env.NODE_ENV !== 'development') {
  tasksQueue.add('daily-devotion', null, {
    jobId: 'daily-devotion',
    repeat: {
      pattern: '0 10 * * *'
    },
    attempts: 3,
    removeOnFail: true
  });
}
