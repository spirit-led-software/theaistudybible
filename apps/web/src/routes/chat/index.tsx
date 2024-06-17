import { Navigate } from '@solidjs/router';
import { ChatWindow } from '~/components/chat/window';
import { useChatStore } from '~/components/providers/chat';

export default function ChatPage() {
  const [chatStore] = useChatStore();
  if (chatStore.chat) {
    console.log('Redirecting to chat: ', chatStore.chat);
    return <Navigate href={`/chat/${chatStore.chat.id}`} />;
  }
  return <ChatWindow chatId={chatStore.chat} />;
}
