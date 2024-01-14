import { getTodaysDateString } from '@lib/util/date';
import { generateDiveDeeperQuery } from '@lib/util/devotion';
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

  let query = devotion.diveDeeperQueries[0];
  if (!query) {
    query = await generateDiveDeeperQuery(devotion);
    devotion = await updateDevotion(devotion.id, {
      diveDeeperQueries: [query]
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
      title: `Dive Deeper`,
      body: query
    },
    data: {
      task: 'chat-query',
      query
    }
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Success' })
  };
};
