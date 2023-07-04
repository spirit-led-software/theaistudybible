import { Base } from './base';

export type SourceDocument = Base & {
  content: string;
  metadata: string;
};

export default SourceDocument;
