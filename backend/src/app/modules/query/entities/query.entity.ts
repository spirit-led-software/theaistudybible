import { Chat } from '@modules/chat/entities/chat.entity';
import { Expose } from 'class-transformer';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { QueryResult } from './query-result.entity';

@Entity()
export class Query {
  @PrimaryGeneratedColumn()
  id: number;

  @Expose({ groups: ['query'] })
  @ManyToOne(() => Chat, (chat) => chat.queries)
  chat: Chat;

  @Column()
  query: string;

  @Expose({ groups: ['query'] })
  @OneToOne(() => QueryResult, (queryResult) => queryResult.query, {
    eager: true,
  })
  @JoinColumn()
  result: QueryResult;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated: Date;
}
