import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { WebsiteIndexRequest } from './dto/website-index-request.dto';
import { IndexService } from './index.service';

@Controller('index')
export class IndexController {
  constructor(private readonly indexService: IndexService) {}

  @Get()
  async getIndexOperations() {
    const indexOperations = await this.indexService.getIndexOperations();
    return indexOperations;
  }

  @Get(':id')
  async getOperation(@Param('id') id: number) {
    const indexOperation = await this.indexService.getIndexOperation(id);
    return indexOperation;
  }

  @Post('website')
  async indexWebsite(@Body() body: WebsiteIndexRequest) {
    const indexOperation = await this.indexService.queueIndexWebsiteOp(body);
    return indexOperation;
  }
}
