import { Navigate } from '@solidjs/router';
import { SignedIn, SignedOut, SignIn } from 'clerk-solidjs';
import { ChatWindow } from '~/components/chat/window';
import { useChatStore } from '~/contexts/chat';

export default function ChatPage() {
  const [chatStore] = useChatStore();
  if (chatStore.chat) {
    return <Navigate href={`/chat/${chatStore.chat.id}`} />;
  }
  return (
    <>
      <SignedIn>
        <ChatWindow />
      </SignedIn>
      <SignedOut>
        <div class="flex h-full w-full flex-col items-center justify-center">
          <SignIn />
        </div>
      </SignedOut>
    </>
  );
}
