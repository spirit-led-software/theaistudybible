import { indexOperations } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const IndexOperationSchema = createSelectSchema(indexOperations);

export const CreateIndexOperationSchema = createInsertSchema(indexOperations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateIndexOperationSchema = CreateIndexOperationSchema.partial();
