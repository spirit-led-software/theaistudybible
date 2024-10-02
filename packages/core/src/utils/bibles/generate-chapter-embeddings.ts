import { vectorStore } from '@/ai/vector-store';
import { db } from '@/core/database';
import { chaptersToSourceDocuments } from '@/core/database/schema';
import type { Bible, Book, Chapter, Verse } from '@/schemas/bibles/types';
import { versesToDocs } from './verses-to-docs';

export const generateChapterEmbeddings = async ({
  verses,
  chapter,
  book,
  bible,
}: {
  verses: Verse[];
  chapter: Omit<Chapter, 'content'>;
  book: Book;
  bible: Bible;
}) => {
  const docs = versesToDocs({
    bible,
    book,
    chapter,
    verses,
  });

  // Process documents in smaller batches
  const batchSize = 100;
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);
    await vectorStore.addDocuments(batch);
    await db
      .insert(chaptersToSourceDocuments)
      .values(
        batch.map((doc) => ({
          chapterId: chapter.id,
          sourceDocumentId: doc.id,
        })),
      )
      .onConflictDoNothing();
  }

  console.log(`Successfully added ${docs.length} documents to vector store for ${chapter.name}`);
};
