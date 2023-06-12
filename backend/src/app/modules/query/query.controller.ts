import { Body, Controller, Logger, Post } from '@nestjs/common';
import { QueryRequest } from './dto/query-request.dto';
import { QueryService } from './query.service';

@Controller('query')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Post()
  async newQuery(@Body() body: QueryRequest) {
    Logger.log(`Received query request: ${JSON.stringify(body)}`);
    return await this.queryService.query(body);
  }
}
