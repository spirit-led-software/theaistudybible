import { InferModel } from "drizzle-orm";
import { PgUpdateSetSource } from "drizzle-orm/pg-core";
import { aiResponses } from "../schema";

export type AiResponse = InferModel<typeof aiResponses, "select">;

export type CreateAiResponseData = InferModel<typeof aiResponses, "insert">;

export type UpdateAiResponseData = PgUpdateSetSource<typeof aiResponses>;
