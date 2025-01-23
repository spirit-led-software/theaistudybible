import { useLocation, useNavigate } from '@solidjs/router';
import { ChevronLeft, PenBox, SidebarIcon } from 'lucide-solid';
import { createMemo } from 'solid-js';
import { useChatStore } from '../../contexts/chat';
import { Button } from '../ui/button';
import { SidebarTrigger, useSidebar } from '../ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { H6 } from '../ui/typography';

export const ChatMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [chatStore, setChatStore] = useChatStore();
  const { open, openMobile } = useSidebar();

  const chatName = createMemo(() => chatStore.chat?.name ?? 'New Chat');

  return (
    <div
      class='flex w-full justify-center border-b pt-2 shadow-xs'
      role='banner'
      aria-label='Chat header'
    >
      <div class='flex w-full max-w-3xl items-center justify-between px-3 py-1'>
        <div class='flex items-center gap-2'>
          <SidebarTrigger as={Button} size='icon' variant='ghost'>
            {open() || openMobile() ? <ChevronLeft /> : <SidebarIcon />}
          </SidebarTrigger>
          <H6 class='truncate' aria-label='Chat name'>
            {chatName()}
          </H6>
        </div>
        <div class='flex justify-end' role='toolbar' aria-label='Chat actions'>
          <Tooltip>
            <TooltipTrigger
              as={Button}
              size='icon'
              variant='ghost'
              onClick={() => {
                setChatStore('chatId', null);
                if (location.pathname.startsWith('/chat/')) {
                  navigate('/chat');
                }
              }}
              aria-label='Start new chat'
            >
              <PenBox />
            </TooltipTrigger>
            <TooltipContent>New Chat</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};
