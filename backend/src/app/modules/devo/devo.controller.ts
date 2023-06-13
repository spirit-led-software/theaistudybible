import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common';
import { DevoService } from './devo.service';
import { UpdateDevoDto } from './dto/update-devo.dto';

@Controller('devo')
export class DevoController {
  constructor(private readonly devoService: DevoService) {}

  @Get()
  async findAll() {
    return await this.devoService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.devoService.findOne(+id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDevoDto: UpdateDevoDto) {
    return await this.devoService.update(+id, updateDevoDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.devoService.remove(+id);
  }
}
