import { useBibleStore } from '@/www/contexts/bible';
import { createChatScrollAnchor } from '@/www/hooks/create-chat-scroll-anchor';
import { useChat } from '@/www/hooks/use-chat';
import { createWritableMemo } from '@solid-primitives/memo';
import { useWindowSize } from '@solid-primitives/resize-observer';
import { useLocation, useSearchParams } from '@solidjs/router';
import { Show, createEffect, createMemo, on } from 'solid-js';
import { getRequestEvent, isServer } from 'solid-js/web';
import { toast } from 'solid-sonner';
import { useChatStore } from '../../contexts/chat';
import { SidebarProvider } from '../ui/sidebar';
import { ChatInput } from './input';
import { ChatMenu } from './menu';
import { ChatMessageList } from './message-list';
import { ChatMetaTags } from './meta-tags';
import { ChatSidebar } from './sidebar';

export type ChatWindowProps = {
  additionalContext?: string;
};

export const ChatWindow = (props: ChatWindowProps) => {
  const [chatStore, setChatStore] = useChatStore();
  const [bibleStore] = useBibleStore();

  const chatConfig = createMemo(() => ({
    id: chatStore.chatId ?? undefined,
    body: {
      additionalContext: props.additionalContext,
      modelId: chatStore.modelId,
      bibleAbbreviation: bibleStore.bible?.abbreviation,
    },
  }));

  const {
    id,
    input,
    setInput,
    handleSubmit,
    status,
    error,
    messages,
    messagesQuery,
    append: appendBase,
    stop,
    addToolResult,
    chatQuery,
    remainingMessagesQuery,
    chatSuggestionsResult,
  } = useChat(() => chatConfig());

  const isLoading = createMemo(() => status() === 'submitted' || status() === 'streaming');

  const windowSize = useWindowSize();
  const isMobile = createMemo(() => windowSize.width < 768);

  const location = useLocation();
  const isChatPage = createMemo(() => {
    if (isServer) {
      return new URL(getRequestEvent()!.request.url).pathname.startsWith('/chat');
    }
    return location.pathname.startsWith('/chat');
  });

  const [isSidebarOpen, setIsSidebarOpen] = createWritableMemo(() => !isMobile() && isChatPage());

  createEffect(() => {
    setChatStore('chatId', id() ?? null);
  });

  createEffect(() => {
    if (chatQuery.status === 'success') {
      setChatStore('chat', chatQuery.data.chat);
    }
  });

  createEffect(
    on(error, (error) => {
      if (error) {
        try {
          const parsedError = JSON.parse(error.message);
          toast.error(parsedError.message);
        } catch {
          toast.error(error.message);
        }
      }
    }),
  );

  const { isAtBottom, scrollToBottom, setScrollRef, setBottomRef, setTopOfLastMessageRef } =
    createChatScrollAnchor(() => ({ isLoading: isLoading() }));

  const append = (...args: Parameters<typeof appendBase>) => {
    const result = appendBase(...args);
    scrollToBottom();
    return result;
  };

  const [searchParams, setSearchParams] = useSearchParams();
  createEffect(
    on(
      () => searchParams?.query,
      (query) => {
        if (query) {
          const messageContent = Array.isArray(query) ? query[0] : query;
          append({ role: 'user', content: messageContent });
          setSearchParams({ query: null });
        }
      },
    ),
  );

  // Find the index of the last message grouped by role
  const lastMessageIdx = createMemo(() => {
    const currentMessages = messages();
    if (currentMessages.length === 0) {
      return 0;
    }

    let idx = currentMessages.length - 1;
    const groupRole = currentMessages[idx]?.role;
    while (idx >= 0 && currentMessages[idx - 1]?.role === groupRole) {
      idx--;
    }
    return idx;
  });

  return (
    <SidebarProvider
      class='min-h-full flex-1 overflow-hidden'
      style={{ '--sidebar-width': '20rem' }}
      open={isSidebarOpen()}
      onOpenChange={setIsSidebarOpen}
      defaultOpen={!isMobile() && isChatPage()}
    >
      <Show when={isChatPage()}>
        <ChatMetaTags />
      </Show>
      <ChatSidebar />
      <div class='relative flex w-full flex-1 flex-col overflow-hidden' aria-label='Chat window'>
        <ChatMenu />
        <div
          ref={setScrollRef}
          class='flex w-full flex-1 flex-col overflow-y-auto overflow-x-hidden'
          aria-label='Chat messages'
        >
          <ChatMessageList
            messages={messages}
            messagesQuery={messagesQuery}
            isLoading={isLoading()}
            append={append}
            addToolResult={addToolResult}
            additionalContext={props.additionalContext}
            setTopOfLastMessageRef={setTopOfLastMessageRef}
            lastMessageIdx={lastMessageIdx()}
          />
          <div ref={setBottomRef} class='h-40 w-full shrink-0' />
        </div>
        <ChatInput
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          append={append}
          scrollToBottom={scrollToBottom}
          isLoading={isLoading}
          isAtBottom={isAtBottom}
          stop={stop}
          remainingMessagesQuery={remainingMessagesQuery}
          chatSuggestionsResult={chatSuggestionsResult}
        />
      </div>
    </SidebarProvider>
  );
};
