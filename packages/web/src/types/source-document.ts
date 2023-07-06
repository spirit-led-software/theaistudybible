import { Base } from "./base";

export type SourceDocument = Base & {
  content: string;
  metadata: any;
};

export default SourceDocument;
