import { useLocation } from '@tanstack/react-router';
import { ChevronLeft, SidebarIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useChatStore } from '../../contexts/chat';
import { UserButton } from '../auth/user-button';
import { Button } from '../ui/button';
import { SidebarTrigger, useSidebar } from '../ui/sidebar';
import { H6 } from '../ui/typography';
import { EditChatButton } from './sidebar/edit-chat-button';

export const ChatMenu = () => {
  const pathname = useLocation({
    select: (l) => l.pathname,
  });
  const isChatPage = useMemo(() => pathname.startsWith('/chat'), [pathname]);

  const chatStore = useChatStore();
  const { open } = useSidebar();

  const chatName = useMemo(() => chatStore.chat?.name ?? 'New Chat', [chatStore.chat]);

  return (
    <div
      className='flex w-full items-center justify-between gap-2 px-3 py-1 shadow-xs'
      role='banner'
      aria-label='Chat header'
    >
      <div className='flex w-full items-center gap-2 overflow-hidden'>
        <SidebarTrigger asChild>
          <Button variant='ghost' size='icon' aria-label='Open Chat History Sidebar'>
            {open ? <ChevronLeft /> : <SidebarIcon />}
          </Button>
        </SidebarTrigger>
        <H6 className='truncate' aria-label='Chat name'>
          {chatName}
        </H6>
        {chatStore.chat && <EditChatButton chat={chatStore.chat} />}
      </div>
      {isChatPage && <UserButton className='size-8' />}
    </div>
  );
};
