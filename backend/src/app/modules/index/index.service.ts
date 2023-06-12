import { InjectQueue, OnQueueActive, Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job, Queue } from 'bull';
import { Repository } from 'typeorm';
import { scrapeSite } from '../../utils/web-scraper';
import { WebsiteIndexRequest } from './dto/website-index-request.dto';
import { IndexOperation } from './entities/index-operation.entity';

@Processor('indexOperations')
@Injectable()
export class IndexService {
  constructor(
    @InjectRepository(IndexOperation)
    private readonly indexOperationRepository: Repository<IndexOperation>,
    @InjectQueue('indexOperations')
    private readonly indexOperationsQueue: Queue,
  ) {}

  async getIndexOperations() {
    const operations = await this.indexOperationRepository.find();
    return operations;
  }

  async getIndexOperation(id: number) {
    const operation = await this.indexOperationRepository.findOneBy({ id });
    return operation;
  }

  async queueIndexWebsiteOp(body: WebsiteIndexRequest) {
    let indexOperation = new IndexOperation();
    indexOperation.type = 'website';
    indexOperation.url = body.url;
    indexOperation.pathRegex = body.pathRegex;
    indexOperation.status = 'queued';
    indexOperation = await this.indexOperationRepository.save(indexOperation);
    const job = await this.indexOperationsQueue.add(
      'indexWebsite',
      indexOperation.id,
    );
    Logger.log(`Queued job ${job.id} for index operation ${indexOperation.id}`);
    return { job, indexOperation };
  }

  @Process({
    name: 'indexWebsite',
    concurrency: 1,
  })
  async indexWebsite(indexOperationJob: Job<number>): Promise<void> {
    const indexOperation = await this.indexOperationRepository.findOneOrFail({
      where: { id: indexOperationJob.data },
    });
    if (indexOperation.status !== 'queued') {
      Logger.error('Index operation is not in queued state');
      throw new Error('Index operation is not in queued state');
    }
    if (indexOperation.type !== 'website') {
      Logger.error('Unsupported index operation type, more coming soon.');
      throw new Error('Unsupported index operation type');
    }
    indexOperation.status = 'running';
    await this.indexOperationRepository.save(indexOperation);
    await scrapeSite(indexOperation.url, indexOperation.pathRegex)
      .then(async () => {
        indexOperation.status = 'completed';
        await this.indexOperationRepository.save(indexOperation);
      })
      .catch(async () => {
        indexOperation.status = 'failed';
        await this.indexOperationRepository.save(indexOperation);
      });
  }

  @OnQueueActive()
  onActive(job: Job) {
    console.log(
      `Processing job ${job.id} of type ${job.name} with data ${job.data}...`,
    );
  }
}
