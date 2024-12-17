import { useLocation, useNavigate } from '@solidjs/router';
import { PenBox } from 'lucide-solid';
import { createMemo } from 'solid-js';
import { useChatStore } from '../../contexts/chat';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { H6 } from '../ui/typography';
import { ChatSidebar } from './sidebar';

export const ChatMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [chatStore, setChatStore] = useChatStore();

  const chatName = createMemo(() => chatStore.chat?.name ?? 'New Chat');

  return (
    <div
      class='flex w-full justify-center border-b pt-2 shadow-sm'
      role='banner'
      aria-label='Chat header'
    >
      <div class='flex w-full max-w-2xl items-center justify-between px-3 py-1'>
        <H6 class='truncate' aria-label='Chat name'>
          {chatName()}
        </H6>
        <div class='flex justify-end' role='toolbar' aria-label='Chat actions'>
          <Tooltip>
            <TooltipTrigger
              as={Button}
              size='icon'
              variant='ghost'
              onClick={() => {
                setChatStore('chatId', null);
                if (location.pathname.startsWith('/chat')) {
                  navigate('/chat');
                }
              }}
              aria-label='Start new chat'
            >
              <PenBox />
            </TooltipTrigger>
            <TooltipContent>New Chat</TooltipContent>
          </Tooltip>
          <ChatSidebar />
        </div>
      </div>
    </div>
  );
};
