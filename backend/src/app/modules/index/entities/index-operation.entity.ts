import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class IndexOperation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: 'website' | 'file';

  @Column()
  status: 'running' | 'queued' | 'completed' | 'failed' | 'cancelled';

  @Column({ nullable: true })
  metadata: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated: Date;
}
