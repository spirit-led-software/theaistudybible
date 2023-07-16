import { InferModel } from "drizzle-orm";
import { PgUpdateSetSource } from "drizzle-orm/pg-core";
import { roles } from "../schema";

export type Role = InferModel<typeof roles, "select">;

export type CreateRoleData = InferModel<typeof roles, "insert">;

export type UpdateRoleData = PgUpdateSetSource<typeof roles>;
