import { z } from 'zod';

export const chatSuggestionsSchema = z.object({
  suggestions: z
    .object({
      short: z
        .string()
        .describe(
          'A short version of the follow up suggestion that is good for displaying in the UI.',
        ),
      long: z
        .string()
        .describe(
          'A long, descriptive version of the follow up suggestion that will be submitted to the AI agent.',
        ),
    })
    .array()
    .min(1)
    .max(6)
    .describe('A list of 1-6 follow up suggestions for the chat.'),
});
