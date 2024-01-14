import { getTodaysDateString } from '@lib/util/date';
import { generateDiveDeeperQueries } from '@lib/util/devotion';
import { getDevotionByCreatedDate, updateDevotion } from '@services/devotion';
import type { Handler } from 'aws-lambda';
import firebase from 'firebase-admin';
import path from 'path';

export const handler: Handler = async (event) => {
  console.log(event);

  const dateString = getTodaysDateString();
  let devotion = await getDevotionByCreatedDate(dateString);

  if (!devotion) {
    throw new Error('No devotion found');
  }

  let queries = devotion.diveDeeperQueries;
  if (!queries || queries.length === 0) {
    queries = await generateDiveDeeperQueries(devotion, 1);
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
