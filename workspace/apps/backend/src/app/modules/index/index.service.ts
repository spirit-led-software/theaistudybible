import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { scrapeSite } from '../../utils/web-scraper';
import { WebsiteIndexRequest } from './dto/website-index-request.dto';
import { IndexOperation } from './entities/index-operation.entity';

@Injectable()
export class IndexService {
  constructor(
    @InjectRepository(IndexOperation)
    private readonly indexOperationRepository: Repository<IndexOperation>
  ) {}

  async getOperation(id: number) {
    const operation = await this.indexOperationRepository.findOneBy({ id });
    return { operation };
  }

  async indexWebsite(body: WebsiteIndexRequest) {
    const indexOperation = new IndexOperation();
    indexOperation.type = 'website';
    indexOperation.status = 'pending';
    indexOperation.url = body.url;
    indexOperation.pathRegex = body.pathRegex;
    const { id: indexOpId } = await this.indexOperationRepository.save(
      indexOperation
    );
    scrapeSite(body.url, body.pathRegex)
      .then(async () => {
        indexOperation.status = 'completed';
        await this.indexOperationRepository.save(indexOperation);
      })
      .catch(async () => {
        indexOperation.status = 'failed';
        await this.indexOperationRepository.save(indexOperation);
      });
    return indexOpId;
  }
}
