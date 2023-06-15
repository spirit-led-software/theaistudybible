import { Expose } from 'class-transformer';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ChatMessage } from './chat-message';

@Entity()
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  subject: string;

  @Expose({ groups: ['chat'] })
  @OneToMany(() => ChatMessage, (message) => message.chat, { eager: true })
  messages: ChatMessage[];
}
