import { CreateDevoDto, UpdateDevoDto } from '@dtos/devo';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';
import { paginateEntityList } from '@utils/pagination';
import { DevoService } from './devo.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('devotionals')
export class DevoController {
  constructor(private readonly devoService: DevoService) {}

  @SerializeOptions({
    groups: ['devo'],
  })
  @Post()
  async create(@Body() createDevoDto: CreateDevoDto) {
    const devo = await this.devoService.create(createDevoDto);
    return devo;
  }

  @SerializeOptions({
    groups: ['devo'],
  })
  @Get()
  async findAll(@Query('page') page: string, @Query('limit') limit: string) {
    const devos = await this.devoService.findAll();
    return paginateEntityList(devos, +page, +limit);
  }

  @SerializeOptions({
    groups: ['devo'],
  })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const devo = await this.devoService.findOne(id);
    return devo;
  }

  @SerializeOptions({
    groups: ['devo'],
  })
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDevoDto: UpdateDevoDto) {
    const devo = await this.devoService.update(id, updateDevoDto);
    return devo;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.devoService.remove(id);
  }
}
