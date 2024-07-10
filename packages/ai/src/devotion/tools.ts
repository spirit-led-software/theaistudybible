import { tool } from 'ai';
import { z } from 'zod';
import { vectorStore } from '../vector-store';

export const bibleVectorStoreTool = tool({
  description: 'Fetch bible passages for your answer.',
  parameters: z.object({
    terms: z
      .array(z.string())
      .describe('Search terms or phrases that will be used to find relevant bible passages.')
      .min(1)
      .max(4)
  }),
  execute: async ({ terms }) => {
    const maxDocs = 12;
    return (
      await Promise.all(
        terms.map((term) =>
          vectorStore.searchDocuments(term, {
            filter: {
              must: {
                type: 'bible'
              }
            },
            limit: maxDocs / terms.length,
            withMetadata: true,
            withEmbedding: false
          })
        )
      )
    )
      .flat()
      .filter((d, i, a) => a.findIndex((d2) => d2.id === d.id) === i); // remove duplicates
  }
});

export const vectorStoreTool = tool({
  description: 'Fetch relevant resources for your answer.',
  parameters: z.object({
    terms: z
      .array(z.string())
      .describe('Search terms or phrases that will be used to find relevant resources.')
      .min(1)
      .max(4)
  }),
  execute: async ({ terms }) => {
    const maxDocs = 12;
    return (
      await Promise.all(
        terms.map((term) =>
          vectorStore.searchDocuments(term, {
            limit: maxDocs / terms.length,
            withMetadata: true,
            withEmbedding: false
          })
        )
      )
    )
      .flat()
      .filter((d, i, a) => a.findIndex((d2) => d2.id === d.id) === i); // remove duplicates
  }
});
