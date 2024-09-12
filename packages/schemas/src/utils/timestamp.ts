import { z } from 'zod';

export const TimestampSchema = z.date().or(z.string().datetime());
