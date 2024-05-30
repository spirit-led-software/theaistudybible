import './lib/sentry/instrumentation';
// Sentry instrumentation must be above any other imports

import middy from '@middy/core';
import { devotions } from '@theaistudybible/core/database/schema';
import { getTodaysDateString } from '@theaistudybible/core/util/date';
import { db } from '@theaistudybible/server/lib/database';
import { generateDiveDeeperQueries } from '@theaistudybible/server/lib/devotion';
import { eq, sql } from 'drizzle-orm';
import firebase from 'firebase-admin';
import path from 'path';
import sentryMiddleware from '../lib/sentry/middleware';

const lambdaHandler = async () => {
  const dateString = getTodaysDateString();
  let devotion = await db.query.devotions.findFirst({
    where: (devotions) => sql`${devotions.createdAt}::date = ${dateString}::date`
  });

  if (!devotion || devotion.failed) {
    throw new Error('No devotion found');
  }

  let queries = devotion.diveDeeperQueries;
  if (!queries || queries.length === 0) {
    queries = await generateDiveDeeperQueries(devotion);
    [devotion] = await db
      .update(devotions)
      .set({
        diveDeeperQueries: queries
      })
      .where(eq(devotions.id, devotion.id))
      .returning();
  }

  const serviceAccount = await import(path.resolve('firebase-service-account.json'));
  if (firebase.apps.length === 0) {
    firebase.initializeApp({
      credential: firebase.credential.cert(serviceAccount)
    });
  }
  await firebase.messaging().sendToTopic('daily-query', {
    notification: {
      title: 'Dive Deeper',
      body: queries[0]
    },
    data: {
      task: 'chat-query',
      query: queries[0]
    }
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Success' })
  };
};

export const handler = middy().use(sentryMiddleware()).handler(lambdaHandler);
