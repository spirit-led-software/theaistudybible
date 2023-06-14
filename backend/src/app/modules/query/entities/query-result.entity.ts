import { Expose } from 'class-transformer';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Query } from './query.entity';
import { SourceDocument } from './source-document.entity';

@Entity()
export class QueryResult {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  text: string;

  @Expose({ groups: ['query-result', 'source-document'] })
  @OneToOne(() => Query, (query) => query.result)
  query: Query;

  @Expose({ groups: ['query', 'query-result'] })
  @ManyToMany(
    () => SourceDocument,
    (sourceDocuments) => sourceDocuments.queryResults,
    { eager: true },
  )
  @JoinTable()
  sourceDocuments: SourceDocument[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated: Date;
}
