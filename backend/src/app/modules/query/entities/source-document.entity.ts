import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { QueryResult } from './query-result.entity';

@Entity()
export class SourceDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  pageContent: string;

  @Column({ nullable: true })
  metadata: string;

  @ManyToMany(
    () => QueryResult,
    (queryResult) => queryResult.sourceDocuments,
    {},
  )
  queryResults: QueryResult[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated: Date;
}
