import { useNavigate } from '@solidjs/router';
import { PenBox } from 'lucide-solid';
import { createMemo } from 'solid-js';
import { useChatStore } from '../providers/chat';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { H6 } from '../ui/typography';
import { ChatSidebar } from './sidebar';

export const ChatMenu = () => {
  const navigate = useNavigate();
  const [chatStore, setChatStore] = useChatStore();
  const name = createMemo(() => chatStore.chat?.name ?? 'New Chat');

  return (
    <div class="flex w-full items-center justify-between border-b px-3 py-1">
      <H6 class="max-w-md justify-self-center truncate">{name()}</H6>
      <div class="justify-end">
        <Tooltip>
          <TooltipTrigger>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setChatStore('chat', undefined);
                console.log('Set chat to undefined');
                navigate('/chat');
              }}
            >
              <PenBox />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Chat</TooltipContent>
        </Tooltip>
        <ChatSidebar />
      </div>
    </div>
  );
};
