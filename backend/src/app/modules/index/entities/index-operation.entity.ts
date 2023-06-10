import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class IndexOperation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: 'website' | 'document';

  @Column()
  status: 'running' | 'queued' | 'completed' | 'failed';

  @Column({ nullable: true })
  url: string;

  @Column({ nullable: true })
  pathRegex: string;

  @Column({ nullable: true })
  error: string;
}
