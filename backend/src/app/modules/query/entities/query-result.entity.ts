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

  @ManyToMany(() => SourceDocument)
  @JoinTable()
  sourceDocuments: SourceDocument[];
}
