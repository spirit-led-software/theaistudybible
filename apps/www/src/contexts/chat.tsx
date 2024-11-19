import type { Chat } from '@/schemas/chats';
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

  const [store, setStore] = createStore<ChatStore>({
    chatId: others.chatId ?? null,
    chat: null,
    modelId: others.modelId ?? null,
  });

  const [, setChatId] = makePersisted(createSignal(store.chatId), { name: 'chatId' });
  createEffect(() => {
    setChatId(store.chatId);
  });

  const [, setModelId] = makePersisted(createSignal(store.modelId), { name: 'modelId' });
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
