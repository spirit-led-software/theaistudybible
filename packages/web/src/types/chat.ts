import { Base } from "./base";
import ChatMessage from "./chat-message";

export type Chat = Base & {
  name: string;
  messages?: ChatMessage[];
};

export default Chat;
