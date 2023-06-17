import { Expose } from 'class-transformer';
import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base';
import { ChatMessage } from './chat-message';

@Entity()
export class Chat extends BaseEntity {
  @Column()
  subject: string;

  @Expose({ groups: ['chat'] })
  @OneToMany(() => ChatMessage, (message) => message.chat, {
    cascade: true,
    eager: true,
  })
  messages: ChatMessage[];
}
