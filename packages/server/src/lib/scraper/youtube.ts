import { YoutubeLoader } from '@langchain/community/document_loaders/web/youtube';
import {
  dataSources,
  dataSourcesToSourceDocuments,
  indexOperations
} from '@theaistudybible/core/database/schema';
import type { IndexOperation } from '@theaistudybible/core/model/data-source/index-op';
import type { Metadata } from '@theaistudybible/core/types/metadata';
import { getEmbeddingsModelInfo } from '@theaistudybible/langchain/lib/llm';
import { getDocumentVectorStore } from '@theaistudybible/langchain/lib/vector-db';
import { eq, sql } from 'drizzle-orm';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { db } from '../database';

export async function indexYoutubeVideo({
  dataSourceId,
  name,
  url,
  metadata = {}
}: {
  dataSourceId: string;
  name: string;
  url: string;
  metadata?: Metadata;
}) {
  let indexOp: IndexOperation | undefined;
  try {
    [indexOp] = await db
      .insert(indexOperations)
      .values({
        status: 'RUNNING',
        metadata: {
          ...metadata,
          name,
          url
        },
        dataSourceId
      })
      .returning();

    const loader = YoutubeLoader.createFromUrl(url, {
      language: metadata.language ?? 'en',
      addVideoInfo: true
    });
    let docs = await loader.load();

    const embeddingsModelInfo = getEmbeddingsModelInfo();
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: embeddingsModelInfo.chunkSize,
      chunkOverlap: embeddingsModelInfo.chunkOverlap
    });
    docs = await splitter.invoke(docs, {});

    console.log(`Successfully loaded ${docs.length} docs from youtube video.`);
    docs = docs.map((doc) => {
      doc.metadata = {
        ...metadata,
        ...doc.metadata,
        indexDate: new Date().toISOString(),
        type: 'youtube',
        dataSourceId,
        name,
        url
      };

      let newPageContent = `TITLE: ${doc.metadata.name}\n---\n${doc.pageContent}`;
      if (doc.metadata.title && doc.metadata.author) {
        newPageContent = `TITLE: "${doc.metadata.title}" by ${doc.metadata.author}\n---\n${doc.pageContent}`;
      }
      doc.pageContent = newPageContent;

      return doc;
    });

    console.log('Adding documents to vector store');
    const vectorStore = await getDocumentVectorStore({ write: true });
    const ids = await vectorStore.addDocuments(docs);
    console.log(`Successfully indexed youtube video '${url}'.`);
    [[indexOp]] = await Promise.all([
      db
        .update(indexOperations)
        .set({
          status: 'SUCCEEDED'
        })
        .where(eq(indexOperations.id, indexOp!.id))
        .returning(),
      db
        .update(dataSources)
        .set({
          numberOfDocuments: docs.length
        })
        .returning(),
      ...ids.map((sourceDocumentId) =>
        db.insert(dataSourcesToSourceDocuments).values({
          dataSourceId,
          sourceDocumentId
        })
      )
    ]);

    return indexOp;
  } catch (err) {
    console.error(`Error indexing youtube video '${url}':`, err);
    if (indexOp) {
      [indexOp] = await db
        .update(indexOperations)
        .set({
          status: 'FAILED',
          errorMessages: sql`${indexOperations.errorMessages} || jsonb_build_array('${sql.raw(
            err instanceof Error ? `${err.message}: ${err.stack}` : `Error: ${JSON.stringify(err)}`
          )}')`
        })
        .where(eq(indexOperations.id, indexOp.id))
        .returning();
    }
    throw err;
  }
}
