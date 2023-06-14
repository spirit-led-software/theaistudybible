import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { default as s3Config } from '@configs/aws-s3.config';
import { default as milvusConfig } from '@configs/milvus.config';
import { getEmbeddings } from '@configs/openai.config';
import { default as unstructuredConfig } from '@configs/unstructured.config';
import { Injectable, Logger } from '@nestjs/common';
import { mkdtempSync, writeFileSync } from 'fs';
import { UnstructuredLoader } from 'langchain/document_loaders/fs/unstructured';
import { Milvus } from 'langchain/vectorstores/milvus';
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
    const docs = await loader.load();
    Logger.log(`Obtained ${docs.length} documents from file '${s3Key}'`);
    await Milvus.fromDocuments(docs, getEmbeddings(), {
      url: milvusConfig.url,
      collectionName: milvusConfig.collectionName,
      username: milvusConfig.user,
      password: milvusConfig.password,
    });
    Logger.log(`File '${s3Key}' loaded into Milvus successfully`);
  }
}
