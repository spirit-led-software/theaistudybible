import { Column, Entity, ManyToMany } from 'typeorm';
import { BaseEntity } from './base';
import { ChatAnswer } from './chat-answer';
import { Devo } from './devo';

@Entity()
export class SourceDocument extends BaseEntity {
  @Column({ unique: true })
  content: string;

  @Column()
  metadata: string;

  @ManyToMany(() => ChatAnswer, (answer) => answer.sourceDocuments)
  answers: ChatAnswer[];

  @ManyToMany(() => Devo, (devo) => devo.sourceDocuments)
  devotionals: Devo[];
}
