import { Base } from "./base";
import { SourceDocument } from "./source-document";

export type Devo = Base & {
  subject: string;
  content: string;
  sourceDocuments?: SourceDocument[];
};

export default Devo;
