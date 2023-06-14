import { Devo } from '@modules/devo/entities/devo.entity';
import { Expose } from 'class-transformer';
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

  @Expose({ groups: ['source-document'] })
  @ManyToMany(
    () => QueryResult,
    (queryResult) => queryResult.sourceDocuments,
    {},
  )
  queryResults: QueryResult[];

  @Expose({ groups: ['source-document'] })
  @ManyToMany(() => Devo, (devo) => devo.sourceDocuments, {})
  devotionals: Devo[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated: Date;
}
