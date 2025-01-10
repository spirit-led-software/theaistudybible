import { sessions } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const SessionSchema = createSelectSchema(sessions);

export const CreateSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  userId: true,
});

export const UpdateSessionSchema = CreateSessionSchema.partial();
