import { toTitleCase } from "@core/util/string";
import { generateDevotion, getDevotionByDate } from "@services/devotion";
import type { Handler } from "aws-lambda";
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
    if (firebase.apps.length === 0) {
      firebase.initializeApp({
        credential: firebase.credential.cert(serviceAccount),
      });
    }
    await firebase.messaging().sendToTopic("daily-devo", {
      notification: {
        title: `Today's Daily Devo: ${toTitleCase(devo!.topic)}`,
        body: devo?.bibleReading,
        badge: "1",
      },
      data: {
        task: "daily-devo",
        id: devo!.id,
      },
    });
  }

  return {
    statusCode: 200,
    body: JSON.stringify(devo),
  };
};
