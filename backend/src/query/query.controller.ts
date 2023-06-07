import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateQueryDto } from './dto/create-query.dto';
import { UpdateQueryDto } from './dto/update-query.dto';
import { QueryService } from './query.service';

@Controller('query')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Post()
  create(@Body() createQueryDto: CreateQueryDto) {
    return this.queryService.create(createQueryDto);
  }

  @Get()
  findAll() {
    return this.queryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.queryService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQueryDto: UpdateQueryDto) {
    return this.queryService.update(+id, updateQueryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.queryService.remove(+id);
  }
}
