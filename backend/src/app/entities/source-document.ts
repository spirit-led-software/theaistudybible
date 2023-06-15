import { Expose } from 'class-transformer';
import { Column, Entity, ManyToMany } from 'typeorm';
import { BaseEntity } from './base';
import { ChatAnswer } from './chat-answer';
import { Devo } from './devo';

@Entity()
export class SourceDocument extends BaseEntity {
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
}
