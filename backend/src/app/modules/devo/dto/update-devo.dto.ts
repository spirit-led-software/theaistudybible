import { PartialType } from '@nestjs/mapped-types';
import { CreateDevoDto } from './create-devo.dto';

export class UpdateDevoDto extends PartialType(CreateDevoDto) {}
