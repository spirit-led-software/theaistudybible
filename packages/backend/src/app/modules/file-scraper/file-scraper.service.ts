import { IndexOperation } from '@entities/index-op';
import { S3Service } from '@modules/s3/s3.service';
import { VectorDBService } from '@modules/vector-db/vector-db.service';
import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import { mkdtempSync, writeFileSync } from 'fs';
import { UnstructuredLoader } from 'langchain/document_loaders/fs/unstructured';
import { TokenTextSplitter } from 'langchain/text_splitter';
import { tmpdir } from 'os';
import { join } from 'path';
import { Repository } from 'typeorm';

@Processor('indexOperations')
@Injectable()
export class FileScraperService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectRepository(IndexOperation)
    private readonly indexOperationRepository: Repository<IndexOperation>,
    private readonly s3Service: S3Service,
    private readonly vectorDbService: VectorDBService,
  ) {}

  @Process({
    name: 'indexFile',
    concurrency: 1,
  })
  async indexFile(indexOperationJob: Job<string>): Promise<void> {
    let indexOperation: IndexOperation = null;
    try {
      indexOperation = await this.indexOperationRepository.findOneByOrFail({
        id: indexOperationJob.data,
      });
      if (indexOperation.status !== 'queued') {
        throw new Error('Index operation is not in queued state');
      }
      if (indexOperation.type !== 'file') {
        throw new Error('Unsupported index operation type for this processor');
      }
      indexOperation.status = 'running';
      await this.indexOperationRepository.save(indexOperation);
      const { s3Key } = JSON.parse(indexOperation.metadata);
      await this.scrapeFile(s3Key);
      indexOperation.status = 'completed';
      await this.indexOperationRepository.save(indexOperation);
    } catch (err) {
      if (indexOperation) {
        indexOperation.status = 'failed';
        const existingMetadata = JSON.parse(indexOperation.metadata);
        indexOperation.metadata = JSON.stringify({
          error: `${err.stack}`,
          ...existingMetadata,
        });
        await this.indexOperationRepository.save(indexOperation);
      }
      this.logger.error(`${err.stack}`);
      throw err;
    }
  }

  async scrapeFile(s3Key) {
    try {
      const s3GetResult = await this.s3Service.downloadObject(s3Key);
      const filename = s3Key.split('/').pop();
      const prettyName = s3GetResult.Metadata['pretty-name'];
      const fileContent = await s3GetResult.Body.transformToByteArray();
      const tmpDir = mkdtempSync(join(tmpdir(), 'langchain-'));
      const filePath = join(tmpDir, filename);
      writeFileSync(filePath, fileContent);
      this.logger.log(`File '${s3Key}' saved to ${filePath}`);

      const loader = new UnstructuredLoader(filePath);

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
          indexDate: new Date().toISOString(),
          s3Key,
          source: prettyName,
          type: 'S3 File',
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
