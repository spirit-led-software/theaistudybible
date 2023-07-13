import * as dotenv from "dotenv";

export function loadEnvironment() {
  dotenv.config({
    path: ".env.local",
  });

  if (!process.env.VECTOR_DB_URL) {
    throw new Error("Missing VECTOR_DB_URL environment variable");
  }

  if (!process.env.VECTOR_DB_API_KEY) {
    throw new Error("Missing VECTOR_DB_API_KEY environment variable");
  }

  if (!process.env.VECTOR_DB_COLLECTION_NAME) {
    throw new Error("Missing VECTOR_DB_COLLECTION_NAME environment variable");
  }
}
