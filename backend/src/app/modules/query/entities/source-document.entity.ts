import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class SourceDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  pageContent: string;

  @Column()
  source: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated: Date;
}
