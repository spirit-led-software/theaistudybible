import { Query } from '@modules/query/entities/query.entity';
import { Expose } from 'class-transformer';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  subject: string;

  @Expose({ groups: ['chat'] })
  @OneToMany(() => Query, (query) => query.chat, { eager: true })
  queries: Query[];
}
