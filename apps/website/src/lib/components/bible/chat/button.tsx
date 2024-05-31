import { Button } from '@/components/ui/button';
import { useBibleStore } from '@/hooks/use-bible-store';
import { MessageSquare } from 'lucide-react';

export default function ChatButton() {
  const { chatOpen, setChatOpen } = useBibleStore((store) => ({
    chatOpen: store.chatOpen,
    setChatOpen: store.setChatOpen
  }));

  return (
    <Button
      className={`mx-auto h-12 w-20 rounded-t-2xl transition duration-200 ${chatOpen ? 'translate-y-full' : 'delay-200'}`}
      onClick={() => setChatOpen(!chatOpen)}
    >
      <MessageSquare size={20} />
    </Button>
  );
}
