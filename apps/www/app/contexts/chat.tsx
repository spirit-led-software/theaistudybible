import type { Chat } from '@/schemas/chats/types';
import { type ReactNode, createContext, useContext, useRef } from 'react';
import { useStore } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { type StoreApi, createStore } from 'zustand/vanilla';

export type ChatState = {
  chatId: string | null;
  chat: Chat | null;
  modelId: string | null;
};

export type ChatActions = {
  setChatId: React.Dispatch<React.SetStateAction<string | null>>;
  setChat: React.Dispatch<React.SetStateAction<Chat | null>>;
  setModelId: React.Dispatch<React.SetStateAction<string | null>>;
};

export type ChatStore = ChatState & ChatActions;

export type ChatContextValue = StoreApi<ChatStore>;

export const ChatContext = createContext<ChatContextValue | null>(null);

export type ChatProviderProps = {
  chatId?: string | null;
  modelId?: string | null;
  children: ReactNode;
};

export const ChatProvider = ({ chatId, modelId, children }: ChatProviderProps) => {
  const storeRef = useRef<ChatContextValue>(null);

  if (!storeRef.current) {
    storeRef.current = createStore<ChatStore>()(
      persist(
        (set, get) => ({
          chatId: chatId ?? null,
          chat: null,
          modelId: modelId ?? null,
          setChatId: (input) => {
            let chatId: string | null;
            if (typeof input === 'function') {
              chatId = input(get().chatId);
            } else {
              chatId = input;
            }
            set({ chatId });
          },
          setChat: (input) => {
            let chat: Chat | null;
            if (typeof input === 'function') {
              chat = input(get().chat);
            } else {
              chat = input;
            }
            set({ chat });
          },
          setModelId: (input) => {
            let modelId: string | null;
            if (typeof input === 'function') {
              modelId = input(get().modelId);
            } else {
              modelId = input;
            }
            set({ modelId });
          },
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
    return useStore(chatStoreContext) as T;
  }

  return useStore(chatStoreContext, useShallow(selector));
};
