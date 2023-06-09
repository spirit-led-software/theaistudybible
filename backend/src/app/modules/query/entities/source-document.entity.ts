import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SourceDocumentMetadata } from './source-document-metadata.entity';

@Entity()
export class SourceDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  pageContent: string;

  @OneToOne(() => SourceDocumentMetadata)
  @JoinColumn()
  metadata: SourceDocumentMetadata;
}
