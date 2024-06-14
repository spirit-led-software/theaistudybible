import { Document } from '@langchain/core/documents';
import { chaptersToSourceDocuments } from '@theaistudybible/core/database/schema';
import { Bible, Book, Chapter } from '@theaistudybible/core/model/bible';
import { getEmbeddingsModelInfo } from '@theaistudybible/langchain/lib/llm';
import { getDocumentVectorStore } from '@theaistudybible/langchain/lib/vector-db';
import { db } from '@theaistudybible/server/lib/database';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { contentsToText } from './content';

export const generateChapterEmbeddings = async ({
  chapter,
  book,
  bible
}: {
  chapter: Chapter;
  book: Book;
  bible: Bible;
}) => {
  const contentText = contentsToText(chapter.content);
  const embeddingsModelInfo = getEmbeddingsModelInfo();
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: embeddingsModelInfo.chunkSize,
    chunkOverlap: embeddingsModelInfo.chunkOverlap
  });
  let docs = await splitter.invoke([
    new Document({
      pageContent: contentText,
      metadata: {
        name: `${book.shortName} ${chapter.number}`
      }
    })
  ]);

  docs = docs.map((doc) => {
    doc.metadata = {
      ...doc.metadata,
      indexDate: new Date().toISOString(),
      type: 'bible',
      bibleId: bible.id,
      bookId: book.id,
      chapterId: chapter.id,
      url: `/bible/${bible.abbreviation}/${book.abbreviation}/${chapter.number}`
    };

    let newPageContent = `TITLE: ${doc.metadata.name}\n---\n${doc.pageContent}`;
    if (doc.metadata.title && doc.metadata.author) {
      newPageContent = `TITLE: "${doc.metadata.title}" by ${doc.metadata.author}\n---\n${doc.pageContent}`;
    }
    doc.pageContent = newPageContent;

    return doc;
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
