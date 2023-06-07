import { Injectable } from '@nestjs/common';
import { CreateQueryDto } from './dto/create-query.dto';
import { UpdateQueryDto } from './dto/update-query.dto';

@Injectable()
export class QueryService {
  create(createQueryDto: CreateQueryDto) {
    return 'This action adds a new query';
  }

  findAll() {
    return `This action returns all query`;
  }

  findOne(id: number) {
    return `This action returns a #${id} query`;
  }

  update(id: number, updateQueryDto: UpdateQueryDto) {
    return `This action updates a #${id} query`;
  }

  remove(id: number) {
    return `This action removes a #${id} query`;
  }
}
