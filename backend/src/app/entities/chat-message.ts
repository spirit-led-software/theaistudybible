import { Expose } from 'class-transformer';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Chat } from './chat';
import { ChatAnswer } from './chat-answer';

@Entity()
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Expose({ groups: ['chat-message'] })
  @ManyToOne(() => Chat, (chat) => chat.messages)
  chat: Chat;

  @Column()
  message: string;

  @Expose({ groups: ['chat-message'] })
  @OneToOne(() => ChatAnswer, (chatAnswer) => chatAnswer.message, {
    eager: true,
  })
  @JoinColumn()
  answer: ChatAnswer;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated: Date;
}
