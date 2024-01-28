import type { Message } from 'ai';

export type RAIChatMessage = Message & {
  uuid?: string;
  modelId?: string;
  searchQueries?: string[];
};
