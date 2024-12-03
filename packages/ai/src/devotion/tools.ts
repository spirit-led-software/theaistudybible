import { sourceDocuments } from '@/core/database/schema';
import { tool } from 'ai';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import type { DocumentWithScore } from '../types/document';
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
    return (
      await Promise.all(
        terms.map((term) =>
          vectorStore.searchDocuments(term, {
            filter: sql`${sourceDocuments.metadata}->>'type' = 'bible'`,
            limit: 12,
            withMetadata: true,
            withEmbedding: false,
          }),
        ),
      )
    )
      .flat()
      .reduce((unique, doc) => {
        if (!unique.has(doc.id)) {
          unique.set(doc.id, doc);
        }
        return unique;
      }, new Map<string, DocumentWithScore>())
      .values()
      .toArray()
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
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
    return (
      await Promise.all(
        terms.map((term) =>
          vectorStore.searchDocuments(term, {
            limit: 8,
            withMetadata: true,
            withEmbedding: false,
          }),
        ),
      )
    )
      .flat()
      .reduce((unique, doc) => {
        if (!unique.has(doc.id)) {
          unique.set(doc.id, doc);
        }
        return unique;
      }, new Map<string, DocumentWithScore>())
      .values()
      .toArray()
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  },
});
