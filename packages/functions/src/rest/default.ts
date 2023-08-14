import { NotFoundResponse } from "@lib/api-responses";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  console.log("Received API Event:", event);
  return NotFoundResponse("The route you are looking for does not exist!");
});
