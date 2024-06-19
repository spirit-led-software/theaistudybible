import { useNavigate } from '@solidjs/router';
import { PenBox } from 'lucide-solid';
import { useChatStore } from '../providers/chat';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { H6 } from '../ui/typography';
import { ChatSidebar } from './sidebar';

export const ChatMenu = () => {
  const navigate = useNavigate();
  const [chatStore, setChatStore] = useChatStore();

  return (
    <div class="flex w-full justify-center border-b">
      <div class="flex w-full max-w-2xl items-center justify-between px-3 py-1">
        <H6 class="max-w-md justify-self-center truncate">{chatStore.chat?.name ?? 'New Chat'}</H6>
        <div class="flex justify-end">
          <Tooltip>
            <TooltipTrigger
              as={Button}
              size="icon"
              variant="ghost"
              onClick={() => {
                setChatStore('chat', undefined);
                navigate('/chat');
              }}
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