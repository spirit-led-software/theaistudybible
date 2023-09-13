import { generateDevotion, getDevotionByDate } from "@services/devotion";
import { Handler } from "aws-lambda";
import firebase from "firebase-admin";
import path from "path";

export const handler: Handler = async (event, _) => {
  console.log(event);

  let devo = await getDevotionByDate(new Date());

  if (!devo) {
    devo = await generateDevotion();

    const serviceAccount = require(path.resolve(
      "firebase-service-account.json"
    ));
    firebase.initializeApp({
      credential: firebase.credential.cert(serviceAccount),
    });

    await firebase.messaging().sendToTopic("daily-devo", {
      notification: {
        title: "New Daily Devo",
        body: devo?.bibleReading,
      },
    });
  }

  return {
    statusCode: 200,
    body: JSON.stringify(devo),
  };
};
