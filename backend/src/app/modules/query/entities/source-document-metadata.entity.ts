import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class SourceDocumentMetadata {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  source: string;
}
