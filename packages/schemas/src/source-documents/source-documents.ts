import { sourceDocuments } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { MetadataSchema } from '../utils';
import { defaultRefine } from '../utils/default-refine';

const refine = {
  ...defaultRefine,
  metadata: MetadataSchema,
  embedding: z.array(z.number()),
};

export const SourceDocumentSchema = createSelectSchema(sourceDocuments, refine);

export const CreateSourceDocumentSchema = createInsertSchema(sourceDocuments, refine).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateSourceDocumentSchema = CreateSourceDocumentSchema.partial();
