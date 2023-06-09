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

  @Column({ nullable: true })
  history: string[];

  @OneToOne(() => QueryResult, (queryResult) => queryResult.query)
  @JoinColumn()
  result: QueryResult;
}
