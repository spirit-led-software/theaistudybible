import { MessageSquare } from 'lucide-solid';
import { createMemo } from 'solid-js';
import { Button } from '~/components/ui/button';
import { bibleStore, setBibleStore } from '~/lib/stores/bible';

export default function ChatButton() {
  const chatOpen = createMemo(() => bibleStore.chatOpen);
  const setChatOpen = (open: boolean) => setBibleStore('chatOpen', open);

  return (
    <Button
      class={`mx-auto h-12 w-20 rounded-t-2xl transition duration-200 ${chatOpen() ? 'translate-y-full' : 'delay-200'}`}
      onClick={() => setChatOpen(!chatOpen())}
    >
      <MessageSquare size={20} />
    </Button>
  );
}
