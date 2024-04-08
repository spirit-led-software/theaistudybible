import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import config from '@revelationsai/core/configs/revelationsai';
import { dataSourcesToSourceDocuments, indexOperations } from '@revelationsai/core/database/schema';
import type { IndexOperation } from '@revelationsai/core/model/data-source/index-op';
import type { Metadata } from '@revelationsai/core/types/metadata';
import { db } from '@revelationsai/server/lib/database';
import { getDocumentVectorStore } from '@revelationsai/server/lib/vector-db';
import { getDataSourceOrThrow, updateDataSource } from '@revelationsai/server/services/data-source';
import {
  createIndexOperation,
  updateIndexOperation
} from '@revelationsai/server/services/data-source/index-op';
import type { S3Handler } from 'aws-lambda';
import { sql } from 'drizzle-orm';
import { mkdtempSync, writeFileSync } from 'fs';
import type { BaseDocumentLoader } from 'langchain/dist/document_loaders/base';
import { DocxLoader } from 'langchain/document_loaders/fs/docx';
import { JSONLoader } from 'langchain/document_loaders/fs/json';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { UnstructuredLoader } from 'langchain/document_loaders/fs/unstructured';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { tmpdir } from 'os';
import { join } from 'path';

const s3Client = new S3Client({});

export const handler: S3Handler = async (event) => {
  const records = event.Records;
  const { bucket, object } = records[0].s3;

  if (!bucket || !object) {
    throw new Error('Invalid S3 event');
  }

  const { key, size } = object;

  let indexOp: IndexOperation | undefined;
  try {
    const sanitizedKey = decodeURIComponent(key).replace(/\+/g, ' ');
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucket.name,
      Key: sanitizedKey
    });

    const getRequest = await s3Client.send(getObjectCommand);
    if (!getRequest.Body) {
      throw new Error('Failed to get file from S3');
    }

    const byteArray = await getRequest.Body.transformToByteArray();
    if (!byteArray) {
      throw new Error('Failed to get file from S3');
    }

    const fileName = sanitizedKey;
    const fileType = getRequest.ContentType;
    const blob = new Blob([byteArray]);
    const metadata = getRequest.Metadata ?? {};
    const { datasourceid: dataSourceId, name, url } = metadata;

    if (!dataSourceId || !name || !url) {
      throw new Error('Missing required metadata');
    }

    let indexOpMetadata: Metadata = {
      ...metadata,
      name,
      url,
      fileName,
      size,
      fileType
    };

    let loader: BaseDocumentLoader;
    if (fileType === 'application/pdf') {
      console.log('Using PDF loader');
      loader = new PDFLoader(blob, {
        splitPages: false
      });
    } else if (fileType === 'text/plain') {
      console.log('Using plain text loader');
      loader = new TextLoader(blob);
    } else if (fileType === 'application/json' || fileType === 'text/json') {
      console.log('Using JSON loader');
      loader = new JSONLoader(blob);
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      console.log('Using DOCX loader');
      loader = new DocxLoader(blob);
    } else {
      console.log('Using unstructured loader');
      const tmpDir = mkdtempSync(join(tmpdir(), 'langchain-'));
      const filePath = join(tmpDir, fileName);
      writeFileSync(filePath, Buffer.from(await blob.arrayBuffer()));
      loader = new UnstructuredLoader(filePath, {
        apiKey: config.unstructured.apiKey
      });
      indexOpMetadata = {
        ...indexOpMetadata,
        tempFilePath: filePath
      };
    }

    let [indexOp, dataSource] = await Promise.all([
      createIndexOperation({
        status: 'RUNNING',
        metadata: indexOpMetadata,
        dataSourceId
      }),
      getDataSourceOrThrow(dataSourceId)
    ]);

    console.log('Starting load documents');
    let docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.llm.embeddings.chunkSize,
      chunkOverlap: config.llm.embeddings.chunkOverlap
    });
    console.log('Starting split documents');
    docs = await splitter.invoke(docs, {});

    console.log('Finished load and split documents');
    console.log(`Loaded ${docs.length} documents`);
    docs = docs.map((doc) => {
      doc.metadata = {
        ...dataSource.metadata,
        ...indexOpMetadata,
        ...doc.metadata,
        indexDate: new Date().toISOString(),
        type: 'file',
        dataSourceId
      };
      let newPageContent = `TITLE: ${doc.metadata.name}\n-----\nCONTENT: ${doc.pageContent}`;
      if (doc.metadata.title && doc.metadata.author) {
        newPageContent = `TITLE: "${doc.metadata.title}" by ${doc.metadata.author}\n-----\nCONTENT: ${doc.pageContent}`;
      }
      doc.pageContent = newPageContent;
      return doc;
    });
    console.log('Adding documents to vector store');
    const vectorStore = await getDocumentVectorStore({ write: true });
    const ids = await vectorStore.addDocuments(docs);
    [indexOp, dataSource] = await Promise.all([
      updateIndexOperation(indexOp!.id, {
        status: 'SUCCEEDED'
      }),
      updateDataSource(dataSourceId, {
        numberOfDocuments: docs.length
      }),
      ...ids.map((sourceDocumentId) =>
        db.insert(dataSourcesToSourceDocuments).values({
          dataSourceId,
          sourceDocumentId
        })
      )
    ]);
    console.log('Finished adding documents to vector store');
  } catch (error) {
    console.error('Error indexing file:', error);
    if (indexOp) {
      indexOp = await updateIndexOperation(indexOp.id, {
        status: 'FAILED',
        errorMessages: sql`${indexOperations.errorMessages} || jsonb_build_array('${sql.raw(
          error instanceof Error
            ? `${error.message}: ${error.stack}`
            : `Error: ${JSON.stringify(error)}`
        )}')`
      });
    }

    throw error;
  }
};
