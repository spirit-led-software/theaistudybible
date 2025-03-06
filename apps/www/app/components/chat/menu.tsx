import { useIsChatPage } from '@/www/hooks/use-is-chat-page';
import { ChevronLeft, SidebarIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useChatStore } from '../../contexts/chat';
import { UserButton } from '../auth/user-button';
import { SidebarTrigger, useSidebar } from '../ui/sidebar';
import { H6 } from '../ui/typography';
import { EditChatButton } from './sidebar/edit-chat-button';

export const ChatMenu = () => {
  const chatStore = useChatStore();
  const chatName = useMemo(() => chatStore.chat?.name ?? 'New Chat', [chatStore.chat]);

  const { open } = useSidebar();
  const isChatPage = useIsChatPage();

  return (
    <div
      className='flex w-full items-center justify-between gap-2 px-3 py-1 shadow-xs'
      role='banner'
      aria-label='Chat header'
    >
      <div className='flex w-full items-center gap-2 overflow-hidden'>
        <SidebarTrigger variant='ghost' size='icon' aria-label='Open Chat History Sidebar'>
          {open ? <ChevronLeft /> : <SidebarIcon />}
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
