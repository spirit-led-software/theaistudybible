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
    return await Promise.all(
      terms.map((term) =>
        vectorStore.searchDocuments(term, {
          filter: 'type = "bible"',
          limit: 12,
          withMetadata: true,
          withEmbedding: false,
        }),
      ),
    ).then((docs) =>
      docs
        .flat()
        .filter((doc, index, self) => index === self.findIndex((d) => d.id === doc.id))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8),
    );
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
    return await Promise.all(
      terms.map((term) =>
        vectorStore.searchDocuments(term, {
          limit: 8,
          withMetadata: true,
          withEmbedding: false,
        }),
      ),
    ).then((docs) =>
      docs
        .flat()
        .filter((doc, index, self) => index === self.findIndex((d) => d.id === doc.id))
        .sort((a, b) => b.score - a.score)
        .slice(0, 4),
    );
  },
});
