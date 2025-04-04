import type { Chat } from '@/schemas/chats/types';
import { type ReactNode, createContext, useContext, useEffect, useRef } from 'react';
import { useStore } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { type StoreApi, createStore } from 'zustand/vanilla';

export type ChatState = {
  chat: Chat | null;
  modelId: string | null;
};

export type ChatActions = {
  setChat: React.Dispatch<React.SetStateAction<Chat | null>>;
  setModelId: React.Dispatch<React.SetStateAction<string | null>>;
};

export type ChatStore = ChatState & ChatActions;

export type ChatContextValue = StoreApi<ChatStore>;

export const ChatContext = createContext<ChatContextValue | null>(null);

export type ChatProviderProps = {
  chat?: Chat | null;
  modelId?: string | null;
  children: ReactNode;
};

export const ChatProvider = ({ chat, modelId, children }: ChatProviderProps) => {
  const storeRef = useRef<ChatContextValue>(null);

  if (!storeRef.current) {
    storeRef.current = createStore<ChatStore>()(
      persist(
        (set, get) => ({
          chat: chat ?? null,
          modelId: modelId ?? null,
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

  useEffect(() => {
    if (storeRef.current) {
      storeRef.current.setState({
        chat: chat ?? null,
        modelId: modelId ?? null,
      });
    }
  }, [chat, modelId]);

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
