import type { z } from 'zod';
import type { MetadataSchema } from './metadata';
import type { TimestampSchema } from './timestamp';

export type Metadata = z.infer<typeof MetadataSchema>;

export type Timestamp = z.infer<typeof TimestampSchema>;
