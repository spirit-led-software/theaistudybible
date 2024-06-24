import { vectorStore } from '@theaistudybible/ai/vector-store';
import { db } from '@theaistudybible/core/database';
import { chaptersToSourceDocuments } from '@theaistudybible/core/database/schema';
import { Bible, Book, Chapter, Verse } from '@theaistudybible/core/model/bible';
import { versesToDocs } from './content';

export const generateChapterEmbeddings = async ({
  verses,
  chapter,
  book,
  bible
}: {
  verses: Verse[];
  chapter: Chapter;
  book: Book;
  bible: Bible;
}) => {
  const docs = versesToDocs({
    bible,
    book,
    chapter,
    verses
  });
  await vectorStore.addDocuments(docs);
  await db.insert(chaptersToSourceDocuments).values(
    docs.map((doc) => ({
      chapterId: chapter.id,
      sourceDocumentId: doc.id
    }))
  );
  console.log(`Successfully added ${docs.length} documents to vector store for ${chapter.name}`);
};
