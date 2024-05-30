import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: 'https://02ee5db470f9b37912176d0dcded70de@o4507103632359424.ingest.us.sentry.io/4507340918947840',
  sampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0.0
});
