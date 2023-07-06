import { Base } from "./base";
import SourceDocument from "./source-document";

export type ChatMessage = Base & {
  text: string;
  type: "user" | "bot";
  sourceDocuments?: SourceDocument[];
};

export default ChatMessage;
