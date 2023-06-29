import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base';

@Entity()
export class IndexOperation extends BaseEntity {
  @Column()
  type: 'website' | 'file';

  @Column()
  status: 'running' | 'queued' | 'completed' | 'failed' | 'cancelled';

  @Column()
  metadata: string;
}
