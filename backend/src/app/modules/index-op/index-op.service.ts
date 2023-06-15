import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { default as s3Config } from '@configs/aws-s3';
import { CreateWebsiteIndexOperationDto } from '@dtos/index-operation';
import { IndexOperation } from '@entities';
import { FileScraperService } from '@modules/file-scraper/file-scraper.service';
import { WebScraperService } from '@modules/web-scraper/web-scraper.service';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job, Queue } from 'bull';
import { Repository } from 'typeorm';

@Processor('indexOperations')
@Injectable()
export class IndexOpService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectRepository(IndexOperation)
    private readonly indexOperationRepository: Repository<IndexOperation>,
    @InjectQueue('indexOperations')
    private readonly indexOperationsQueue: Queue,
    private readonly webScraperService: WebScraperService,
    private readonly fileScraperService: FileScraperService,
  ) {}

  async getIndexOperations() {
    const operations = await this.indexOperationRepository.find();
    return operations;
  }

  async getIndexOperation(id: number) {
    const operation = await this.indexOperationRepository.findOneBy({
      id,
    });
    return operation;
  }

  async cancelIndexOperation(id: number) {
    const operation = await this.indexOperationRepository.findOneByOrFail({
      id,
    });
    if (operation.status !== 'queued' && operation.status !== 'running') {
      this.logger.error('Index operation is not in a cancellable state');
      throw new Error('Index operation is not in a cancellable state');
    }
    const job = await this.indexOperationsQueue.getJob(operation.id);
    if (job) {
      await job.remove();
    }
    operation.status = 'cancelled';
    await this.indexOperationRepository.save(operation);
    return operation;
  }

  async queueIndexWebsiteOperation(body: CreateWebsiteIndexOperationDto) {
    let indexOperation = new IndexOperation();
    indexOperation.type = 'website';
    indexOperation.metadata = JSON.stringify({
      url: body.url,
      pathRegex: body.pathRegex,
    });
    indexOperation.status = 'queued';
    indexOperation = await this.indexOperationRepository.save(indexOperation);
    const job = await this.indexOperationsQueue.add(
      'indexWebsite',
      indexOperation.id,
      {
        attempts: 1,
      },
    );
    this.logger.log(
      `Queued job ${job.id} for website index operation ${indexOperation.id}`,
    );
    return { job, indexOperation };
  }

  @Process({
    name: 'indexWebsite',
    concurrency: 1,
  })
  async indexWebsite(indexOperationJob: Job<number>): Promise<void> {
    let indexOperation: IndexOperation = null;
    try {
      indexOperation = await this.indexOperationRepository.findOneOrFail({
        where: { id: indexOperationJob.data },
      });
      if (indexOperation.status !== 'queued') {
        throw new Error('Index operation is not in queued state');
      }
      if (indexOperation.type !== 'website') {
        throw new Error('Unsupported index operation type for this processor');
      }
      indexOperation.status = 'running';
      await this.indexOperationRepository.save(indexOperation);
      const { url, pathRegex } = JSON.parse(indexOperation.metadata);
      await this.webScraperService.scrapeSite(url, pathRegex);
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

  async queueIndexFileOperation(file: Express.Multer.File) {
    const s3Client = new S3Client({
      region: s3Config.region,
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      },
    });
    const uploadCommand = new PutObjectCommand({
      Bucket: s3Config.bucketName,
      Key: file.originalname,
      Body: file.buffer,
    });
    await s3Client.send(uploadCommand);

    this.logger.log(`Uploaded file ${file.originalname} to S3`);

    let indexOperation = new IndexOperation();
    indexOperation.type = 'file';
    indexOperation.metadata = JSON.stringify({
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      s3Key: file.originalname,
    });
    indexOperation.status = 'queued';
    indexOperation = await this.indexOperationRepository.save(indexOperation);
    const job = await this.indexOperationsQueue.add(
      'indexFile',
      indexOperation.id,
      {
        attempts: 1,
      },
    );
    this.logger.log(
      `Queued job ${job.id} for file index operation ${indexOperation.id}`,
    );
    return { job, indexOperation };
  }

  @Process({
    name: 'indexFile',
    concurrency: 1,
  })
  async indexFile(indexOperationJob: Job<number>): Promise<void> {
    let indexOperation: IndexOperation = null;
    try {
      indexOperation = await this.indexOperationRepository.findOneOrFail({
        where: { id: indexOperationJob.data },
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
      await this.fileScraperService.scrapeFile(s3Key);
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
}
