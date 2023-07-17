import { generateDevotion } from "@chatesv/core/services/devotion";
import { Handler } from "aws-lambda";

export const handler: Handler = async (event, _) => {
  console.log(event);

  const devo = await generateDevotion();

  return {
    statusCode: 200,
    body: JSON.stringify(devo),
  };
};
