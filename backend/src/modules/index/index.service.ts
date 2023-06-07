import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { scrapeSite } from 'src/utils/web-scraper';
import { Repository } from 'typeorm';
import { WebsiteIndexRequest } from './dto/website-index-request.dto';
import { IndexOperation } from './entities/index-operation.entity';

@Injectable()
export class IndexService {
  constructor(
    @InjectRepository(IndexOperation)
    private readonly indexOperationRepository: Repository<IndexOperation>,
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
      indexOperation,
    );
    scrapeSite(body.url, body.pathRegex)
      .then(() => {
        indexOperation.status = 'completed';
        this.indexOperationRepository.save(indexOperation);
      })
      .catch(() => {
        indexOperation.status = 'failed';
        this.indexOperationRepository.save(indexOperation);
      });
    return indexOpId;
  }
}
