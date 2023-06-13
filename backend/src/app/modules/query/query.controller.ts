import {
  Body,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { CreateQueryDto } from './dto/create-query.dto';
import { QueryService } from './query.service';

@Controller('queries')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Get()
  async getQueries() {
    return await this.queryService.getAllQueries();
  }

  @Get(':id')
  async getQuery(@Param('id') id: string) {
    const query = await this.queryService.getQuery(+id);
    if (!query) {
      throw new NotFoundException();
    }
    return query;
  }

  @Get(':id/result')
  async getQueryResult(@Param('id') id: string) {
    return (await this.queryService.getQuery(+id)).result;
  }

  @Post()
  async newQuery(@Body() body: CreateQueryDto) {
    Logger.log(`Received query request: ${JSON.stringify(body)}`);
    return await this.queryService.query(body);
  }
}
