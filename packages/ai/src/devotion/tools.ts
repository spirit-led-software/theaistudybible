import { tool } from 'ai';
import { z } from 'zod';
import { vectorStore } from '../vector-store';

export const bibleVectorStoreTool = tool({
  description: 'Bible Vector Store: Fetch bible passages for your output.',
  parameters: z.object({
    terms: z
      .array(
        z.object({
          term: z.string().describe('The search term or phrase to search for.'),
          weight: z
            .number()
            .min(0)
            .max(1)
            .optional()
            .default(1)
            .describe(
              'The weight of the search term between 0 and 1. The default is 1. A weight of 0 will not be used to rerank the results.',
            ),
        }),
      )
      .min(1)
      .max(5)
      .describe(
        '1 to 5 search terms or phrases that will be used to find relevant bible passages. The search terms are searched separately and should not rely on each other.',
      ),
  }),
  execute: async ({ terms }) => {
    try {
      const docs = await Promise.all(
        terms.map(({ term, weight }) =>
          vectorStore
            .searchDocuments(term, {
              filter: `(type = "bible" or type = "BIBLE") and bibleAbbreviation = "NASB"`,
              limit: 10,
              withMetadata: true,
              withEmbedding: false,
            })
            .then((docs) =>
              docs.map((doc) => ({
                ...doc,
                score: doc.score * weight,
              })),
            ),
        ),
      ).then((docs) =>
        docs
          .flat()
          .filter((doc, index, self) => index === self.findIndex((d) => d.id === doc.id))
          .toSorted((a, b) => b.score - a.score),
      );

      return {
        status: 'success',
        documents: docs,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  },
});

export const vectorStoreTool = tool({
  description: 'Vector Store: Fetch relevant resources for your output.',
  parameters: z.object({
    terms: z
      .array(
        z.object({
          term: z.string().describe('The search term or phrase to search for.'),
          weight: z
            .number()
            .min(0)
            .max(1)
            .optional()
            .default(1)
            .describe(
              'The weight of the search term between 0 and 1. The default is 1. A weight of 0 will not be used to rerank the results.',
            ),
        }),
      )
      .min(1)
      .max(4)
      .describe(
        '1 to 4 search terms or phrases that will be used to find relevant resources. The search terms are searched separately and should not rely on each other.',
      ),
  }),
  execute: async ({ terms }) => {
    try {
      const docs = await Promise.all(
        terms.map(({ term, weight }) =>
          vectorStore
            .searchDocuments(term, {
              limit: 12,
              withMetadata: true,
              withEmbedding: false,
            })
            .then((docs) =>
              docs.map((doc) => ({
                ...doc,
                score: doc.score * weight,
              })),
            ),
        ),
      ).then((docs) =>
        docs
          .flat()
          .filter((doc, index, self) => index === self.findIndex((d) => d.id === doc.id))
          .toSorted((a, b) => b.score - a.score),
      );

      return {
        status: 'success',
        documents: docs.slice(0, 12),
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  },
});
