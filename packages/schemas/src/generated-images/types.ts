import type { z } from 'zod';
import type {
  CreateUserGeneratedImageSchema,
  UpdateUserGeneratedImageSchema,
  UserGeneratedImageSchema,
} from './generated-images';

export type UserGeneratedImage = z.infer<typeof UserGeneratedImageSchema>;
export type CreateUserGeneratedImage = z.infer<typeof CreateUserGeneratedImageSchema>;
export type UpdateUserGeneratedImage = z.infer<typeof UpdateUserGeneratedImageSchema>;
