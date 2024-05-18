import { getTodaysDateString } from '@revelationsai/core/util/date';
import { generateDiveDeeperQueries } from '@revelationsai/server/lib/devotion';
import { getDevotionByCreatedDate, updateDevotion } from '@revelationsai/server/services/devotion';
import type { Handler } from 'aws-lambda';
import firebase from 'firebase-admin';
import path from 'path';

export const handler: Handler = async (event) => {
  console.log(event);

  const dateString = getTodaysDateString();
  let devotion = await getDevotionByCreatedDate(dateString);

  if (!devotion || devotion.failed) {
    throw new Error('No devotion found');
  }

  let queries = devotion.diveDeeperQueries;
  if (!queries || queries.length === 0) {
    queries = await generateDiveDeeperQueries(devotion);
    devotion = await updateDevotion(devotion.id, {
      diveDeeperQueries: queries
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const serviceAccount = require(path.resolve('firebase-service-account.json'));
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
