import { Expose } from 'class-transformer';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ChatAnswer } from './chat-answer';
import { Devo } from './devo';

@Entity()
export class SourceDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  pageContent: string;

  @Column({ nullable: true })
  metadata: string;

  @Expose({ groups: ['source-document'] })
  @ManyToMany(() => ChatAnswer, (answer) => answer.sourceDocuments, {})
  answers: ChatAnswer[];

  @Expose({ groups: ['source-document'] })
  @ManyToMany(() => Devo, (devo) => devo.sourceDocuments, {})
  devotionals: Devo[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated: Date;
}
