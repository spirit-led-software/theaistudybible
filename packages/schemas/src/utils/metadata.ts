import { z } from 'zod';

export const MetadataSchema = z.record(z.any());

export type Metadata = z.infer<typeof MetadataSchema>;
