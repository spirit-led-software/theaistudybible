import { getTodaysDateString } from "@revelationsai/core/util/date";
import { toTitleCase } from "@revelationsai/core/util/string";
import { db } from "@revelationsai/server/lib/database";
import { generateDevotion } from "@revelationsai/server/lib/devotion";
import type { Handler } from "aws-lambda";
import { sql } from "drizzle-orm";
import firebase from "firebase-admin";
import path from "path";

export const handler: Handler = async (event) => {
  console.log(event);

  const dateString = getTodaysDateString();
  let devo = await db.query.devotions.findFirst({
    where: (devotions) =>
      sql`${devotions.createdAt}::date = ${dateString}::date`,
  });

  if (!devo || devo.failed) {
    devo = await generateDevotion();
    if (!devo || devo.failed) {
      throw new Error("Failed to generate devotion");
    }

    const serviceAccount = await import(
      path.resolve("firebase-service-account.json")
    );
    if (firebase.apps.length === 0) {
      firebase.initializeApp({
        credential: firebase.credential.cert(serviceAccount),
      });
    }
    await firebase.messaging().sendToTopic("daily-devo", {
      notification: {
        title: `Today's Daily Devo: ${toTitleCase(devo.topic)}`,
        body: devo.bibleReading,
        badge: "1",
      },
      data: {
        task: "daily-devo",
        id: devo.id,
      },
    });
  }
};
