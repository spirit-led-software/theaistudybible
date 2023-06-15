import { Expose } from 'class-transformer';
import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
import { BaseEntity } from './base';
import { SourceDocument } from './source-document';

@Entity()
export class Devo extends BaseEntity {
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
}
