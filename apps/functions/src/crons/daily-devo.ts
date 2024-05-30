import './lib/sentry/instrumentation';
// Sentry instrumentation must be above any other imports

import middy from '@middy/core';
import { getTodaysDateString } from '@theaistudybible/core/util/date';
import { toTitleCase } from '@theaistudybible/core/util/string';
import { db } from '@theaistudybible/server/lib/database';
import { generateDevotion } from '@theaistudybible/server/lib/devotion';
import { sql } from 'drizzle-orm';
import firebase from 'firebase-admin';
import path from 'path';
import sentryMiddleware from '../lib/sentry/middleware';

const lambdaHandler = async () => {
  const dateString = getTodaysDateString();
  let devo = await db.query.devotions.findFirst({
    where: (devotions) => sql`${devotions.createdAt}::date = ${dateString}::date`
  });

  if (!devo || devo.failed) {
    devo = await generateDevotion();
    if (!devo || devo.failed) {
      throw new Error('Failed to generate devotion');
    }

    const serviceAccount = await import(path.resolve('firebase-service-account.json'));
    if (firebase.apps.length === 0) {
      firebase.initializeApp({
        credential: firebase.credential.cert(serviceAccount)
      });
    }
    await firebase.messaging().sendToTopic('daily-devo', {
      notification: {
        title: `Today's Daily Devo: ${toTitleCase(devo.topic)}`,
        body: devo.bibleReading,
        badge: '1'
      },
      data: {
        task: 'daily-devo',
        id: devo.id
      }
    });
  }
};

export const handler = middy().use(sentryMiddleware()).handler(lambdaHandler);
