import type { z } from 'zod';
import type { CreateSessionSchema, SessionSchema, UpdateSessionSchema } from '.';

export type Session = z.infer<typeof SessionSchema>;
export type CreateSession = z.infer<typeof CreateSessionSchema>;
export type UpdateSession = z.infer<typeof UpdateSessionSchema>;
