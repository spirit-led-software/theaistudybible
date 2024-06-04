import { createStore } from 'solid-js/store';

export type ChatStore = {
  chatId?: string;
  query?: string;
};

export const [chatStore, setChatStore] = createStore<ChatStore>({
  chatId: undefined,
  query: undefined
});
