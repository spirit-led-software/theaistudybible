import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { QueryResult } from './query-result.entity';

@Entity()
export class Query {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  query: string;

  @Column('text', { nullable: true, array: true })
  history: string[];

  @OneToOne(() => QueryResult, (queryResult) => queryResult.query, {
    cascade: true,
    eager: true,
  })
  @JoinColumn()
  result: QueryResult;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated: Date;
}
