import { Base } from './base';

export type ChatMessage = Base & {
  text: string;
};

export default ChatMessage;
