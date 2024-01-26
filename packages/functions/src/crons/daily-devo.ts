import { getTodaysDateString } from '@revelationsai/core/util/date';
import { toTitleCase } from '@revelationsai/core/util/string';
import { generateDevotion } from '@revelationsai/server/lib/util/devotion';
import { getDevotionByCreatedDate } from '@revelationsai/server/services/devotion';
import type { Handler } from 'aws-lambda';
import firebase from 'firebase-admin';
import path from 'path';

export const handler: Handler = async (event) => {
  console.log(event);

  const dateString = getTodaysDateString();
  let devo = await getDevotionByCreatedDate(dateString);

  if (!devo) {
    devo = await generateDevotion();

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const serviceAccount = require(path.resolve('firebase-service-account.json'));
    if (firebase.apps.length === 0) {
      firebase.initializeApp({
        credential: firebase.credential.cert(serviceAccount)
      });
    }
    await firebase.messaging().sendToTopic('daily-devo', {
      notification: {
        title: `Today's Daily Devo: ${toTitleCase(devo!.topic)}`,
        body: devo?.bibleReading,
        badge: '1'
      },
      data: {
        task: 'daily-devo',
        id: devo!.id
      }
    });
  }

  return {
    statusCode: 200,
    body: JSON.stringify(devo)
  };
};
