import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDevoDto } from './dto/create-devo.dto';
import { UpdateDevoDto } from './dto/update-devo.dto';
import { Devo } from './entities/devo.entity';

@Injectable()
export class DevoService {
  constructor(
    @InjectRepository(Devo) private readonly devoRepository: Repository<Devo>,
  ) {}

  async create(createDevoDto: CreateDevoDto) {
    return 'This action adds a new devo';
  }

  async findAll() {
    return `This action returns all devo`;
  }

  async findOne(id: number) {
    return `This action returns a #${id} devo`;
  }

  async update(id: number, updateDevoDto: UpdateDevoDto) {
    return `This action updates a #${id} devo`;
  }

  async remove(id: number) {
    return `This action removes a #${id} devo`;
  }
}
