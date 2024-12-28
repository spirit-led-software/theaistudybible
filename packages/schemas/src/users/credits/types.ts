import type { z } from 'zod';
import type { CreateUserCreditsSchema, UpdateUserCreditsSchema, UserCreditsSchema } from '.';

export type UserCredits = z.infer<typeof UserCreditsSchema>;
export type CreateUserCredits = z.infer<typeof CreateUserCreditsSchema>;
export type UpdateUserCredits = z.infer<typeof UpdateUserCreditsSchema>;
