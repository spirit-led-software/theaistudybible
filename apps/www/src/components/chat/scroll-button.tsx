import type { createChatScrollAnchor } from '@/www/hooks/create-chat-scroll-anchor';
import { ChevronDown } from 'lucide-solid';
import { Button } from '../ui/button';

export type ChatScrollButtonProps = {
  scrollToBottom: ReturnType<typeof createChatScrollAnchor>['scrollToBottom'];
};

export const ChatScrollButton = (props: ChatScrollButtonProps) => {
  return (
    <Button
      variant='outline'
      size='icon'
      class='-translate-x-1/2 -top-12 absolute bottom-22 left-1/2 z-40 size-10 rounded-full border-2 bg-background shadow-xl'
      onClick={props.scrollToBottom}
      aria-label='Scroll to bottom of chat'
    >
      <ChevronDown />
    </Button>
  );
};
