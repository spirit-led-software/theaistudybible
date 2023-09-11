import { generateDevotion, getDevotionByDate } from "@services/devotion";
import { Handler } from "aws-lambda";
import * as fadmin from "firebase-admin";
import { firebaseConfig } from "./configs";

export const handler: Handler = async (event, _) => {
  console.log(event);

  let devo = await getDevotionByDate(new Date());

  if (!devo) {
    devo = await generateDevotion();
  }

  fadmin.initializeApp({
    credential: fadmin.credential.cert({
      projectId: firebaseConfig.projectId,
      privateKey: firebaseConfig.privateKey,
      clientEmail: firebaseConfig.clientEmail,
    }),
  });

  await fadmin.messaging().send({
    topic: "daily-devo",
    notification: {
      title: "New Daily Devo",
      body: devo?.bibleReading,
    },
  });

  return {
    statusCode: 200,
    body: JSON.stringify(devo),
  };
};
