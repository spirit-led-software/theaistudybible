import { Expose } from 'class-transformer';
import { Column, Entity, JoinTable, ManyToMany, OneToOne } from 'typeorm';
import { BaseEntity } from './base';
import { ChatMessage } from './chat-message';
import { SourceDocument } from './source-document';

@Entity()
export class ChatAnswer extends BaseEntity {
  @Column()
  text: string;

  @Expose({ groups: ['chat-answer', 'source-document'] })
  @OneToOne(() => ChatMessage, (message) => message.answer)
  message: ChatMessage;

  @Expose({ groups: ['chat-message', 'chat-answer'] })
  @ManyToMany(
    () => SourceDocument,
    (sourceDocuments) => sourceDocuments.answers,
    { eager: true },
  )
  @JoinTable()
  sourceDocuments: SourceDocument[];
}
