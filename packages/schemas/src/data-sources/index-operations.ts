import { indexOperations } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { MetadataSchema } from '../utils/metadata';
import { defaultRefine } from '../utils/refine';

const refine = {
  ...defaultRefine,
  metadata: MetadataSchema,
};

export const IndexOperationSchema = createSelectSchema(indexOperations, refine);

export const CreateIndexOperationSchema = createInsertSchema(indexOperations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateIndexOperationSchema = CreateIndexOperationSchema.partial();
