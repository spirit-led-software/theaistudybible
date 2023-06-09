import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { WebsiteIndexRequest } from './dto/website-index-request.dto';
import { IndexService } from './index.service';

@Controller('index')
export class IndexController {
  constructor(private readonly indexService: IndexService) {}

  @Get(':id')
  async getOperation(@Param('id') id: number) {
    const operation = await this.indexService.getOperation(id);
    return operation;
  }

  @Post('website')
  async indexWebsite(@Body() body: WebsiteIndexRequest) {
    const id = await this.indexService.indexWebsite(body);
    return { message: 'Indexing website', id };
  }
}
