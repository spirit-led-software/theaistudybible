import { chaptersToSourceDocuments } from '@theaistudybible/core/database/schema';
import { Bible, Book, Chapter, Verse } from '@theaistudybible/core/model/bible';
import { getDocumentVectorStore } from '@theaistudybible/langchain/lib/vector-db';
import { db } from '@theaistudybible/server/lib/database';
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

  const vectorStore = await getDocumentVectorStore({ write: true });
  const ids = await vectorStore.addDocuments(docs);
  await db.insert(chaptersToSourceDocuments).values(
    ids.map((id) => ({
      chapterId: chapter.id,
      sourceDocumentId: id
    }))
  );
  console.log(`Successfully added ${ids.length} documents to vector store for ${chapter.name}`);
};
