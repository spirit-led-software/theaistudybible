import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';
import { CreateQueryDto } from './dto/create-query.dto';
import { QueryService } from './query.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('queries')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @SerializeOptions({
    groups: ['query'],
  })
  @Get()
  async getQueries() {
    const queries = await this.queryService.getAllQueries();
    return queries;
  }

  @SerializeOptions({
    groups: ['query'],
  })
  @Get(':id')
  async getQuery(@Param('id') id: string) {
    const query = await this.queryService.getQuery(+id);
    if (!query) {
      throw new NotFoundException();
    }
    return query;
  }

  @SerializeOptions({
    groups: ['query-result'],
  })
  @Get(':id/result')
  async getQueryResult(@Param('id') id: string) {
    const query = await this.queryService.getQuery(+id);
    if (!query) {
      throw new NotFoundException();
    }
    const result = query.result;
    return result;
  }

  @SerializeOptions({
    groups: ['query'],
  })
  @Post()
  async newQuery(@Body() body: CreateQueryDto) {
    const query = await this.queryService.query(body);
    return query;
  }
}
