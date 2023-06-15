import { Expose } from 'class-transformer';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChatMessage } from './chat-message';
import { SourceDocument } from './source-document';

@Entity()
export class ChatAnswer {
  @PrimaryGeneratedColumn()
  id: number;

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

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated: Date;
}
