import { db } from '@lib/database';
import config from '@revelationsai/core/configs/revelationsai';
import { dataSourcesToSourceDocuments, indexOperations } from '@revelationsai/core/database/schema';
import type { DataSource } from '@revelationsai/core/model/data-source';
import type { IndexOperation } from '@revelationsai/core/model/data-source/index-op';
import type { Metadata } from '@revelationsai/core/types/metadata';
import { sql } from 'drizzle-orm';
import { YoutubeLoader } from 'langchain/document_loaders/web/youtube';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { getDataSourceOrThrow, updateDataSource } from '../../services/data-source';
import { createIndexOperation, updateIndexOperation } from '../../services/data-source/index-op';
import { getDocumentVectorStore } from '../vector-db';

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
    let dataSource: DataSource | undefined;

    [indexOp, dataSource] = await Promise.all([
      createIndexOperation({
        status: 'RUNNING',
        metadata: {
          ...metadata,
          name,
          url
        },
        dataSourceId
      }),
      getDataSourceOrThrow(dataSourceId)
    ]);

    const loader = YoutubeLoader.createFromUrl(url, {
      language: metadata.language ?? 'en',
      addVideoInfo: true
    });
    let docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.llm.embeddings.chunkSize,
      chunkOverlap: config.llm.embeddings.chunkOverlap
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
    [indexOp, dataSource] = await Promise.all([
      updateIndexOperation(indexOp!.id, {
        status: 'SUCCEEDED'
      }),
      updateDataSource(dataSource.id, {
        numberOfDocuments: docs.length
      }),
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
      indexOp = await updateIndexOperation(indexOp.id, {
        status: 'FAILED',
        errorMessages: sql`${indexOperations.errorMessages} || jsonb_build_array('${sql.raw(
          err instanceof Error ? `${err.message}: ${err.stack}` : `Error: ${JSON.stringify(err)}`
        )}')`
      });
    }
    throw err;
  }
}
