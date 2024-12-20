import { z } from 'zod';

export const TimestampSchema = z
  .union([z.date(), z.string().datetime()])
  .transform((val) => (typeof val === 'string' ? new Date(val) : val));
