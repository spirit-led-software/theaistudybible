import { z } from 'zod';

export const ForgotPasswordEmailSchema = z.object({
  type: z.literal('forgot-password'),
  code: z.string(),
});
