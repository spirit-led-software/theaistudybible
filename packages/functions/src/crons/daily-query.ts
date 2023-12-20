import { devotions } from '@core/schema';
import { CHAT_DAILY_QUERY_GENERATOR_PROMPT_TEMPLATE } from '@services/chat/prompts';
import { getDevotions } from '@services/devotion';
import { getLargeContextModel } from '@services/llm';
import type { Handler } from 'aws-lambda';
import { desc } from 'drizzle-orm';
import firebase from 'firebase-admin';
import { PromptTemplate } from 'langchain/prompts';
import { StringOutputParser } from 'langchain/schema/output_parser';
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

export async function getDailyQuery() {
  const queryChain = PromptTemplate.fromTemplate(CHAT_DAILY_QUERY_GENERATOR_PROMPT_TEMPLATE)
    .pipe(
      getLargeContextModel({
        stream: false,
        maxTokens: 256,
        promptSuffix: '<query>',
        stopSequences: ['</query>']
      })
    )
    .pipe(new StringOutputParser());

  return await queryChain.invoke({
    devotion: await getDevotions({
      limit: 1,
      orderBy: desc(devotions.createdAt)
    })
      .then((devotions) => devotions[0])
      .then((devotion) => {
        return [
          `<topic>${devotion.topic}</topic>`,
          `<bible_reading>${devotion.bibleReading}</bible_reading>`,
          `<summary>${devotion.summary}</summary>`,
          `<reflection>${devotion.reflection}</reflection>`,
          `<prayer>${devotion.prayer}</prayer>`
        ].join('\n');
      })
  });
}
