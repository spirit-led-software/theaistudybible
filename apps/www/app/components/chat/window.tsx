import { useBibleStore } from '@/www/contexts/bible';
import { useChat } from '@/www/hooks/use-chat';
import { useChatScrollAnchor } from '@/www/hooks/use-chat-scroll-anchor';
import { useIsChatPage } from '@/www/hooks/use-is-chat-page';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { type RefObject, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useWindowSize } from 'usehooks-ts';
import { useChatStore } from '../../contexts/chat';
import { SidebarProvider } from '../ui/sidebar';
import { ChatInput } from './input';
import { ChatMenu } from './menu';
import { ChatMessageList } from './message-list';
import { ChatSidebar } from './sidebar';

export type ChatWindowProps = {
  additionalContext?: string;
};

export const ChatWindow = (props: ChatWindowProps) => {
  const chatStore = useChatStore();
  const bibleStore = useBibleStore();

  const {
    id,
    input,
    handleInputChange,
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
  } = useChat({
    id: chatStore.chatId ?? undefined,
    body: {
      additionalContext: props.additionalContext,
      modelId: chatStore.modelId,
      bibleAbbreviation: bibleStore.bible?.abbreviation,
    },
  });

  const isLoading = useMemo(() => status === 'submitted' || status === 'streaming', [status]);

  const { width } = useWindowSize();
  const isMobile = useMemo(() => width < 768, [width]);

  const isChatPage = useIsChatPage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile && isChatPage);
  useEffect(() => {
    setIsSidebarOpen(!isMobile && isChatPage);
  }, [isMobile, isChatPage]);

  useEffect(() => {
    chatStore.setChatId(id ?? null);
  }, [id, chatStore.setChatId]);

  useEffect(() => {
    if (chatQuery.status === 'success') {
      chatStore.setChat(chatQuery.data.chat);
    }
  }, [chatQuery.status, chatQuery.data?.chat, chatStore.setChat]);

  useEffect(() => {
    if (error) {
      try {
        const parsedError = JSON.parse(error.message);
        toast.error(parsedError.message);
      } catch {
        toast.error(error.message);
      }
    }
  }, [error]);

  const { isAtBottom, scrollToBottom, scrollRef, bottomRef, topOfLastMessageRef } =
    useChatScrollAnchor({ isLoading: isLoading });

  const append = useCallback(
    (...args: Parameters<typeof appendBase>) => {
      const result = appendBase(...args);
      scrollToBottom();
      return result;
    },
    [appendBase, scrollToBottom],
  );

  const searchParams = useSearch({ strict: false });
  const navigate = useNavigate();
  useEffect(() => {
    const query = searchParams?.query;
    if (query) {
      append({ role: 'user', content: query });
      navigate({
        from: '/chat',
        search: { query: undefined },
      });
    }
  }, [searchParams, navigate, append]);

  // Find the index of the last message grouped by role
  const lastMessageIdx = useMemo(() => {
    const currentMessages = messages;
    if (currentMessages.length === 0) {
      return 0;
    }

    let idx = currentMessages.length - 1;
    const groupRole = currentMessages[idx]?.role;
    while (idx >= 0 && currentMessages[idx - 1]?.role === groupRole) {
      idx--;
    }
    return idx;
  }, [messages]);

  return (
    <SidebarProvider
      className='min-h-full flex-1 overflow-hidden'
      style={{ '--sidebar-width': '20rem' } as React.CSSProperties}
      open={isSidebarOpen}
      onOpenChange={setIsSidebarOpen}
      defaultOpen={!isMobile && isChatPage}
    >
      <ChatSidebar />
      <div
        className='relative flex w-full flex-1 flex-col overflow-hidden'
        aria-label='Chat window'
      >
        <ChatMenu />
        <div
          ref={scrollRef}
          className='flex w-full flex-1 flex-col overflow-y-auto overflow-x-hidden'
          aria-label='Chat messages'
        >
          <ChatMessageList
            messages={messages}
            messagesQuery={messagesQuery}
            isLoading={isLoading}
            append={append}
            addToolResult={addToolResult}
            additionalContext={props.additionalContext}
            topOfLastMessageRef={topOfLastMessageRef as RefObject<HTMLDivElement>}
            lastMessageIdx={lastMessageIdx}
          />
          <div ref={bottomRef} className='h-40 w-full shrink-0' />
        </div>
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
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
