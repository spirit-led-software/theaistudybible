import { Base } from './base';
import { SourceDocument } from './source-document';

export type Devo = Base & {
  content: string;
  sourceDocuments: SourceDocument[];
};

export default Devo;
