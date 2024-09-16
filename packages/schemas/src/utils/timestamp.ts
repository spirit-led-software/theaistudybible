import { z } from 'zod';

export const TimestampSchema = z.date();

export const TimestampInsertSchema = z
  .date()
  .or(z.string().datetime())
  .transform((val) => (typeof val === 'string' ? new Date(val) : val));
