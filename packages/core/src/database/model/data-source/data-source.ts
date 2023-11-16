import type { dataSources } from "../../schema";

export type DataSource = typeof dataSources.$inferSelect;

export type CreateDataSourceData = typeof dataSources.$inferInsert;

export type UpdateDataSourceData = Partial<CreateDataSourceData>;
