import { dataSources } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { MetadataSchema } from '../utils';
import { defaultRefine } from '../utils/default-refine';

const refine = {
  ...defaultRefine,
  metadata: MetadataSchema,
};

export const DataSourceSchema = createSelectSchema(dataSources, refine);

export const CreateDataSourceSchema = createInsertSchema(dataSources, refine).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateDataSourceSchema = CreateDataSourceSchema.partial();
