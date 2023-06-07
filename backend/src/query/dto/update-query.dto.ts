import { PartialType } from '@nestjs/mapped-types';
import { CreateQueryDto } from './create-query.dto';

export class UpdateQueryDto extends PartialType(CreateQueryDto) {}
