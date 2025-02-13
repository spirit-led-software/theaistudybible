import { useLocation } from '@solidjs/router';
import { ChevronLeft, SidebarIcon } from 'lucide-solid';
import { Show, createMemo } from 'solid-js';
import { useChatStore } from '../../contexts/chat';
import { UserButton } from '../auth/user-button';
import { Button } from '../ui/button';
import { SidebarTrigger, useSidebar } from '../ui/sidebar';
import { H6 } from '../ui/typography';
import { EditChatButton } from './sidebar/edit-chat-button';

export const ChatMenu = () => {
  const location = useLocation();
  const [chatStore] = useChatStore();
  const { open } = useSidebar();

  const chatName = createMemo(() => chatStore.chat?.name ?? 'New Chat');

  return (
    <div
      class='flex w-full items-center justify-between gap-2 px-3 py-1'
      role='banner'
      aria-label='Chat header'
    >
      <div class='flex w-full items-center gap-2 overflow-hidden'>
        <SidebarTrigger
          as={Button}
          size='icon'
          variant='ghost'
          aria-label='Open Chat History Sidebar'
        >
          {open() ? <ChevronLeft /> : <SidebarIcon />}
        </SidebarTrigger>
        <H6 class='truncate' aria-label='Chat name'>
          {chatName()}
        </H6>
        <Show when={chatStore.chat} keyed>
          {(chat) => <EditChatButton chat={chat} />}
        </Show>
      </div>
      <Show when={location.pathname.startsWith('/chat')}>
        <UserButton class='size-8' />
      </Show>
    </div>
  );
};
