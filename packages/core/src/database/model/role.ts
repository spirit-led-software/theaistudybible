import { roles } from "../schema";

export type Role = typeof roles.$inferSelect;

export type CreateRoleData = typeof roles.$inferInsert;

export type UpdateRoleData = Partial<CreateRoleData>;
