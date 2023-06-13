import { default as s3Config } from '@configs/aws-s3.config';
import { FileScraperService } from '@modules/file-scraper/file-scraper.service';
import { WebScraperService } from '@modules/web-scraper/web-scraper.service';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import AWS from 'aws-sdk';
import { Job, Queue } from 'bull';
import { Repository } from 'typeorm';
import { CreateWebsiteIndexOperationRequest } from './dto/create-website-index-operation.dto';
import { IndexOperation } from './entities/index-operation.entity';

@Processor('indexOperations')
@Injectable()
export class IndexService {
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
    const operation = await this.indexOperationRepository.findOneByOrFail({
      id,
    });
    return operation;
  }

  async cancelIndexOperation(id: number) {
    const operation = await this.indexOperationRepository.findOneByOrFail({
      id,
    });
    if (operation.status !== 'queued' && operation.status !== 'running') {
      Logger.error('Index operation is not in a cancellable state');
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

  async queueIndexWebsiteOperation(body: CreateWebsiteIndexOperationRequest) {
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
    Logger.log(
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
          error: err,
          ...existingMetadata,
        });
        await this.indexOperationRepository.save(indexOperation);
      }
      Logger.error(err);
      throw err;
    }
  }

  async queueIndexFileOperation(file: Express.Multer.File) {
    const s3 = new AWS.S3({
      accessKeyId: s3Config.accessKeyId,
      secretAccessKey: s3Config.secretAccessKey,
    });
    const uploadResult = await s3
      .upload({
        Bucket: s3Config.bucketName,
        Key: file.filename,
        Body: file.buffer,
      })
      .promise();

    Logger.log(`Uploaded file ${file.filename} to S3`);

    let indexOperation = new IndexOperation();
    indexOperation.type = 'file';
    indexOperation.metadata = JSON.stringify({
      originalName: file.originalname,
      filename: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      s3Key: uploadResult.Key,
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
    Logger.log(
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
    } catch (err) {
      if (indexOperation) {
        indexOperation.status = 'failed';
        const existingMetadata = JSON.parse(indexOperation.metadata);
        indexOperation.metadata = JSON.stringify({
          error: err,
          ...existingMetadata,
        });
        await this.indexOperationRepository.save(indexOperation);
      }
      Logger.error(err);
      throw err;
    }
  }
}
