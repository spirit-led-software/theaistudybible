import { getDailyQuery } from '@services/chat';
import type { Handler } from 'aws-lambda';
import firebase from 'firebase-admin';
import path from 'path';

export const handler: Handler = async (event) => {
  console.log(event);

  const query = await getDailyQuery();

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const serviceAccount = require(path.resolve('firebase-service-account.json'));
  if (firebase.apps.length === 0) {
    firebase.initializeApp({
      credential: firebase.credential.cert(serviceAccount)
    });
  }
  await firebase.messaging().sendToTopic('chat-query', {
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
