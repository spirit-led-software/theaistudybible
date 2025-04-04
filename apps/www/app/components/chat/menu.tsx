import { useIsChatPage } from '@/www/hooks/use-is-chat-page';
import { ChevronLeft, SidebarIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useChatStore } from '../../contexts/chat';
import { UserButton } from '../auth/user-button';
import { SidebarTrigger, useSidebar } from '../ui/sidebar';
import { H6 } from '../ui/typography';
import { EditChatButton } from './sidebar/edit-chat-button';

export const ChatMenu = () => {
  const { chat } = useChatStore((s) => ({
    chat: s.chat,
  }));
  const chatName = useMemo(() => chat?.name ?? 'New Chat', [chat]);

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
        {chat && <EditChatButton chat={chat} />}
      </div>
      {isChatPage && <UserButton className='size-8' />}
    </div>
  );
};
