import type { z } from 'zod';
import type {
  CreateSourceDocumentSchema,
  SourceDocumentSchema,
  UpdateSourceDocumentSchema,
} from './source-documents';

export type SourceDocument = z.infer<typeof SourceDocumentSchema>;
export type CreateSourceDocument = z.infer<typeof CreateSourceDocumentSchema>;
export type UpdateSourceDocument = z.infer<typeof UpdateSourceDocumentSchema>;
