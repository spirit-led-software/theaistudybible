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

  @OneToOne(() => Query, (query) => query.result)
  query: Query;

  @ManyToMany(
    () => SourceDocument,
    (sourceDocuments) => sourceDocuments.queryResults,
    { cascade: true, eager: true },
  )
  @JoinTable()
  sourceDocuments: SourceDocument[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated: Date;
}
