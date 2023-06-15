import { GetObjectCommand } from '@aws-sdk/client-s3';
import { awsS3Config, unstructuredConfig } from '@configs';
import { client as s3Client } from '@configs/aws-s3';
import { getVectorStore } from '@configs/milvus';
import { Injectable, Logger } from '@nestjs/common';
import { mkdtempSync, writeFileSync } from 'fs';
import { UnstructuredLoader } from 'langchain/document_loaders/fs/unstructured';
import { TokenTextSplitter } from 'langchain/text_splitter';
import { tmpdir } from 'os';
import { join } from 'path';

@Injectable()
export class FileScraperService {
  private readonly logger = new Logger(this.constructor.name);

  async scrapeFile(s3Key) {
    try {
      const getObjectCommand = new GetObjectCommand({
        Bucket: awsS3Config.bucketName,
        Key: s3Key,
      });
      const s3GetResult = await s3Client.send(getObjectCommand);
      this.logger.log(`File '${s3Key}' fetched from S3`);

      const filename = s3Key.split('/').pop();
      const fileContent = await s3GetResult.Body.transformToByteArray();
      const tmpDir = mkdtempSync(join(tmpdir(), 'langchain-'));
      const filePath = join(tmpDir, filename);
      writeFileSync(filePath, fileContent);
      this.logger.log(`File '${s3Key}' saved to ${filePath}`);

      const loader = new UnstructuredLoader(filePath, {
        apiUrl: unstructuredConfig.apiUrl,
      });

      this.logger.log(`Loading file '${s3Key}' to Milvus`);
      let docs = await loader.loadAndSplit(
        new TokenTextSplitter({
          chunkSize: 400,
          chunkOverlap: 50,
          encodingName: 'cl100k_base',
        }),
      );
      docs = docs.map((doc) => {
        doc.pageContent = doc.pageContent.replace(/\n/g, ' ').trim();
        doc.metadata = {
          ...doc.metadata,
          // TODO - May need to add metadata for milvus client not to complain
        };
        return doc;
      });
      this.logger.debug(
        `Obtained ${docs.length} documents from file '${s3Key}'`,
      );
      const vectorStore = await getVectorStore();
      await vectorStore.addDocuments(docs);
      this.logger.log(`File '${s3Key}' loaded into Milvus successfully`);
    } catch (err) {
      this.logger.error(`${err.stack}`);
      throw err;
    }
  }
}
