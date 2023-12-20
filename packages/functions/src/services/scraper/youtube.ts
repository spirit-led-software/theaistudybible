import vectorDBConfig from '@core/configs/vector-db';
import type { DataSource } from '@core/model/data-source';
import type { IndexOperation } from '@core/model/data-source/index-op';
import { indexOperations } from '@core/schema';
import type { Metadata } from '@core/types/metadata';
import { getDataSourceOrThrow, updateDataSource } from '@services/data-source';
import { createIndexOperation, updateIndexOperation } from '@services/data-source/index-op';
import { getDocumentVectorStore } from '@services/vector-db';
import { sql } from 'drizzle-orm';
import { YoutubeLoader } from 'langchain/document_loaders/web/youtube';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

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
      chunkSize: vectorDBConfig.docEmbeddingContentLength,
      chunkOverlap: vectorDBConfig.docEmbeddingContentOverlap
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
    const vectorStore = await getDocumentVectorStore();
    await vectorStore.addDocuments(docs);

    console.log(`Successfully indexed youtube video '${url}'.`);
    indexOp = await updateIndexOperation(indexOp!.id, {
      status: 'SUCCEEDED'
    });

    await updateDataSource(dataSource.id, {
      numberOfDocuments: docs.length
    });

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
