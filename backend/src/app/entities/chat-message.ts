import { Expose } from 'class-transformer';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BaseEntity } from './base';
import { Chat } from './chat';
import { ChatAnswer } from './chat-answer';

@Entity()
export class ChatMessage extends BaseEntity {
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
}
