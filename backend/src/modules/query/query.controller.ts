import { Body, Controller, Post } from '@nestjs/common';
import { QueryRequest } from './dto/query-request.dto';
import { QueryService } from './query.service';

@Controller('query')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Post()
  async query(@Body() body: QueryRequest) {
    return this.queryService.query(body);
  }
}
