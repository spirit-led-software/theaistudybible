import { GetObjectCommand } from '@aws-sdk/client-s3';
import { S3Service } from '@modules/s3/s3.service';
import { VectorDBService } from '@modules/vector-db/vector-db.service';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdtempSync, writeFileSync } from 'fs';
import { UnstructuredLoader } from 'langchain/document_loaders/fs/unstructured';
import { TokenTextSplitter } from 'langchain/text_splitter';
import { tmpdir } from 'os';
import { join } from 'path';

@Injectable()
export class FileScraperService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly s3Service: S3Service,
    private readonly vectorDbService: VectorDBService,
  ) {}

  async scrapeFile(s3Key) {
    const s3Config = this.s3Service.getConfig();
    try {
      const getObjectCommand = new GetObjectCommand({
        Bucket: s3Config.bucketName,
        Key: s3Key,
      });
      const s3GetResult = await this.s3Service
        .getClient()
        .send(getObjectCommand);
      this.logger.log(`File '${s3Key}' fetched from S3`);

      const filename = s3Key.split('/').pop();
      const fileContent = await s3GetResult.Body.transformToByteArray();
      const tmpDir = mkdtempSync(join(tmpdir(), 'langchain-'));
      const filePath = join(tmpDir, filename);
      writeFileSync(filePath, fileContent);
      this.logger.log(`File '${s3Key}' saved to ${filePath}`);

      const unstructuredConfig = this.configService.get('unstructured');
      const loader = new UnstructuredLoader(filePath, {
        apiUrl: unstructuredConfig.apiUrl,
      });

      this.logger.log(`Loading file '${s3Key}' to vector database`);
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
          source: `AWS S3: ${s3Key}`,
        };
        return doc;
      });
      this.logger.debug(
        `Obtained ${docs.length} documents from file '${s3Key}'`,
      );
      const vectorStore = await this.vectorDbService.getVectorStore();
      await vectorStore.addDocuments(docs);
      this.logger.log(`File '${s3Key}' loaded into vector store successfully`);
    } catch (err) {
      this.logger.error(`${err.stack}`);
      throw err;
    }
  }
}
