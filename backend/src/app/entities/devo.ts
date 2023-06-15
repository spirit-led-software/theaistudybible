import { Expose } from 'class-transformer';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SourceDocument } from './source-document';

@Entity()
export class Devo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @Expose({ groups: ['devo'] })
  @ManyToMany(
    () => SourceDocument,
    (sourceDocument) => sourceDocument.devotionals,
    {
      cascade: true,
      eager: true,
    },
  )
  @JoinTable()
  sourceDocuments: SourceDocument[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated: Date;
}
