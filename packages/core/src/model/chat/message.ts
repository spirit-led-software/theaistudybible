import type { Message } from 'ai';

export type RAIChatMessage = Omit<Message, 'role'> & {
  role: Message['role'] | 'anonymous';
  uuid?: string;
  modelId?: string;
  searchQueries?: string[];
};
