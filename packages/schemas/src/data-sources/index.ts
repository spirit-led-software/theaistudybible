import { dataSources } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { MetadataSchema } from '../utils/metadata';
import { defaultRefine } from '../utils/refine';

const refine = {
  ...defaultRefine,
  metadata: MetadataSchema,
};

export const DataSourceSchema = createSelectSchema(dataSources, refine);

export const CreateDataSourceSchema = createInsertSchema(dataSources, {
  ...refine,
  name: z.string().min(1).max(255),
  url: z.string().url(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastAutomaticSync: true,
  lastManualSync: true,
});

export const UpdateDataSourceSchema = CreateDataSourceSchema.partial();

export * from './index-operations';
