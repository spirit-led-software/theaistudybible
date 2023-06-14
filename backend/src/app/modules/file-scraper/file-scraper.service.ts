import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { default as s3Config } from '@configs/aws-s3.config';
import { getVectorStore } from '@configs/milvus.config';
import { default as unstructuredConfig } from '@configs/unstructured.config';
import { Injectable, Logger } from '@nestjs/common';
import { mkdtempSync, writeFileSync } from 'fs';
import { UnstructuredLoader } from 'langchain/document_loaders/fs/unstructured';
import { tmpdir } from 'os';
import { join } from 'path';

@Injectable()
export class FileScraperService {
  async scrapeFile(s3Key) {
    const s3Client = new S3Client({
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      },
    });
    const getObjectCommand = new GetObjectCommand({
      Bucket: s3Config.bucketName,
      Key: s3Key,
    });
    const s3GetResult = await s3Client.send(getObjectCommand);
    Logger.log(`File '${s3Key}' fetched from S3`);

    const filename = s3Key.split('/').pop();
    const fileContent = await s3GetResult.Body.transformToByteArray();
    const tmpDir = mkdtempSync(join(tmpdir(), 'langchain-'));
    const filePath = join(tmpDir, filename);
    writeFileSync(filePath, fileContent);
    Logger.log(`File '${s3Key}' saved to ${filePath}`);

    const loader = new UnstructuredLoader(filePath, {
      apiUrl: unstructuredConfig.apiUrl,
    });

    Logger.log(`Loading file '${s3Key}' to Milvus`);
    let docs = await loader.loadAndSplit();
    docs = docs.map((doc) => {
      doc.pageContent = doc.pageContent.replace(/\n/g, ' ').trim();
      doc.metadata = {
        ...doc.metadata,
        // TODO - May need to add metadata for milvus client not to complain
      };
      return doc;
    });
    Logger.debug(`Obtained ${docs.length} documents from file '${s3Key}'`);
    const vectorStore = await getVectorStore();
    await vectorStore.addDocuments(docs);
    Logger.log(`File '${s3Key}' loaded into Milvus successfully`);
  }
}
