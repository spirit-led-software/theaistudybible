import { PutObjectCommand } from '@aws-sdk/client-s3';
import { CreateWebsiteIndexOperationDto } from '@dtos/index-operation';
import { IndexOperation } from '@entities';
import { S3Service } from '@modules/s3/s3.service';
import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { Repository } from 'typeorm';

@Injectable()
export class IndexOpService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectRepository(IndexOperation)
    private readonly indexOperationRepository: Repository<IndexOperation>,
    @InjectQueue('indexOperations')
    private readonly indexOperationsQueue: Queue,
    private readonly s3Service: S3Service,
  ) {}

  async getIndexOperations() {
    const operations = await this.indexOperationRepository.find();
    return operations;
  }

  async getIndexOperation(id: string) {
    const operation = await this.indexOperationRepository.findOneBy({
      id,
    });
    return operation;
  }

  async cancelIndexOperation(id: string) {
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

  async queueIndexFileOperation(file: Express.Multer.File, prettyName: string) {
    const s3Config = this.s3Service.getConfig();
    const s3Client = this.s3Service.getClient();
    const uploadCommand = new PutObjectCommand({
      Bucket: s3Config.bucketName,
      Key: file.originalname,
      Body: file.buffer,
      Metadata: {
        'pretty-name': prettyName,
      },
    });
    await s3Client.send(uploadCommand);

    this.logger.log(`Uploaded file '${file.originalname}' to S3`);

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
}
