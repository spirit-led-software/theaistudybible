import {
  generateDevotion,
  getDevotionByDate,
} from "@revelationsai/core/services/devotion";
import { Handler } from "aws-lambda";

export const handler: Handler = async (event, _) => {
  console.log(event);

  let devo = await getDevotionByDate(new Date());

  if (!devo) {
    devo = await generateDevotion();
  }

  return {
    statusCode: 200,
    body: JSON.stringify(devo),
  };
};
