import type { Chat } from '@/schemas/chats/types';
import { makePersisted } from '@solid-primitives/storage';
import type { JSXElement } from 'solid-js';
import { createContext, createEffect, createSignal, splitProps, useContext } from 'solid-js';
import type { SetStoreFunction, Store } from 'solid-js/store';
import { createStore } from 'solid-js/store';

export type ChatStore = {
  chatId: string | null;
  chat: Chat | null;
  modelId: string | null;
};

export type ChatContextValue = [get: Store<ChatStore>, set: SetStoreFunction<ChatStore>];

export const ChatContext = createContext<ChatContextValue>();

export type ChatProviderProps = {
  chatId?: string;
  modelId?: string;
  children: JSXElement;
};

export const ChatProvider = (props: ChatProviderProps) => {
  const [local, others] = splitProps(props, ['children']);

  const [chatId, setChatId] = makePersisted(createSignal(others.chatId ?? null), {
    name: 'chatId',
  });
  const [modelId, setModelId] = makePersisted(createSignal(others.modelId ?? null), {
    name: 'modelId',
  });

  const [store, setStore] = createStore<ChatStore>({
    chatId: chatId(),
    chat: null,
    modelId: modelId(),
  });
  createEffect(() => {
    setChatId(store.chatId);
  });
  createEffect(() => {
    setModelId(store.modelId);
  });

  return (
    <ChatContext.Provider value={[store, setStore] as ChatContextValue}>
      {local.children}
    </ChatContext.Provider>
  );
};

export const useChatStore = () => {
  const store = useContext(ChatContext);
  if (!store) {
    throw new Error('useChatStore must be used within a ChatProvider');
  }
  return store;
};
