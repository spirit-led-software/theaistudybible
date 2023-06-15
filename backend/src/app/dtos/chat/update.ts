import { CreateChatDto } from '@dtos/chat/create';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateChatDto extends PartialType(CreateChatDto) {
  subject: string;
  queryIds: number[];
}
