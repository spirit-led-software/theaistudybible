import { tool } from 'ai';
import { z } from 'zod';
import { vectorStore } from '../vector-store';

export const bibleVectorStoreTool = tool({
  description: 'Bible Vector Store: Fetch bible passages for your answer.',
  parameters: z.object({
    terms: z
      .array(z.string())
      .describe(
        '1 to 4 search terms or phrases that will be used to find relevant bible passages.',
      ),
  }),
  execute: async ({ terms }) => {
    const maxDocs = 10;
    return (
      await Promise.all(
        terms.map((term) =>
          vectorStore.searchDocuments(term, {
            filter: 'type = "bible"',
            limit: maxDocs / terms.length,
            withMetadata: true,
            withEmbedding: false,
          }),
        ),
      )
    )
      .flat()
      .filter((d, i, a) => a.findIndex((d2) => d2.id === d.id) === i); // remove duplicates
  },
});

export const vectorStoreTool = tool({
  description: 'Vector Store: Fetch relevant resources for your answer.',
  parameters: z.object({
    terms: z
      .array(z.string())
      .describe('1 to 4 search terms or phrases that will be used to find relevant resources.'),
  }),
  execute: async ({ terms }) => {
    const maxDocs = 4;
    return (
      await Promise.all(
        terms.map((term) =>
          vectorStore.searchDocuments(term, {
            limit: maxDocs / terms.length,
            withMetadata: true,
            withEmbedding: false,
          }),
        ),
      )
    )
      .flat()
      .filter((d, i, a) => a.findIndex((d2) => d2.id === d.id) === i); // remove duplicates
  },
});
