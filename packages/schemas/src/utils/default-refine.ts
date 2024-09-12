
import { TimestampSchema } from './timestamp';

export const defaultRefine = {
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
};
