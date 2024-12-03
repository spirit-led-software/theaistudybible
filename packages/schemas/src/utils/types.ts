import type { z } from 'zod';
import type { MetadataSchema } from './metadata';
import type { CreateTimestampSchema, TimestampSchema } from './timestamp';

export type Metadata = z.infer<typeof MetadataSchema>;

export type Timestamp = z.infer<typeof TimestampSchema>;
export type CreateTimestamp = z.infer<typeof CreateTimestampSchema>;
