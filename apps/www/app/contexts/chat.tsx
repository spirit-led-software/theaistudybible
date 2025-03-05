import type { Chat } from '@/schemas/chats/types';
import { type ReactNode, createContext, useContext, useRef } from 'react';
import { useStore } from 'zustand';
import { persist } from 'zustand/middleware';
import { type StoreApi, createStore } from 'zustand/vanilla';

export type ChatState = {
  chatId: string | null;
  chat: Chat | null;
  modelId: string | null;
};

export type ChatActions = {
  setChatId: (chatId: string | null) => void;
  setChat: (chat: Chat | null) => void;
  setModelId: (modelId: string | null) => void;
};

export type ChatStore = ChatState & ChatActions;

export type ChatContextValue = StoreApi<ChatStore>;

export const ChatContext = createContext<ChatContextValue | null>(null);

export type ChatProviderProps = {
  chatId?: string;
  modelId?: string;
  children: ReactNode;
};

export const ChatProvider = ({ chatId, modelId, children }: ChatProviderProps) => {
  const storeRef = useRef<ChatContextValue>(null);

  if (!storeRef.current) {
    storeRef.current = createStore<ChatStore>()(
      persist(
        (set) => ({
          chatId: chatId ?? null,
          chat: null,
          modelId: modelId ?? null,

          setChatId: (chatId) => set({ chatId }),
          setChat: (chat) => set({ chat }),
          setModelId: (modelId) => set({ modelId }),
        }),
        { name: 'chat' },
      ),
    );
  }

  return <ChatContext.Provider value={storeRef.current}>{children}</ChatContext.Provider>;
};

export const useChatStore = <T = ChatStore>(selector?: (state: ChatStore) => T): T => {
  const chatStoreContext = useContext(ChatContext);
  if (!chatStoreContext) {
    throw new Error('useChatStore must be used within ChatProvider');
  }

  if (!selector) {
    return useStore(chatStoreContext, (state) => state) as T;
  }

  return useStore(chatStoreContext, selector);
};
