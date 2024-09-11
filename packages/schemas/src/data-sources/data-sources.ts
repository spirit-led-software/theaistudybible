import { dataSources } from '@/core/database/schema';
import { createSelectSchema } from 'drizzle-zod';

export const DataSourceSchema = createSelectSchema(dataSources);

export const DataSourceIdSchema = DataSourceSchema.pick({ id: true });

export const CreateDataSourceSchema = DataSourceSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateDataSourceSchema = CreateDataSourceSchema.partial();
