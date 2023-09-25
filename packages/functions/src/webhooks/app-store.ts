import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event, context) => {
  console.log(`App Store webhook received: ${JSON.stringify(event)}`);
  return {
    statusCode: 200,
    body: "OK",
  };
});
