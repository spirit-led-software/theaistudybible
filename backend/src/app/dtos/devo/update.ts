import { CreateDevoDto } from '@dtos/devo/create';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateDevoDto extends PartialType(CreateDevoDto) {
  content: string;
}
