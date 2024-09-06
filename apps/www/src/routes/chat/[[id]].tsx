import { ChatWindow } from '@/www/components/chat/window';
import { useChatStore } from '@/www/contexts/chat';
import { getChatMessagesQueryProps, getChatQueryProps } from '@/www/hooks/use-chat';
import type { RouteDefinition } from '@solidjs/router';
import { Navigate, useParams } from '@solidjs/router';
import { useQueryClient } from '@tanstack/solid-query';
import { SignedIn, SignedOut, SignIn } from 'clerk-solidjs';

export const route: RouteDefinition = {
  preload: ({ params }) => {
    const { id } = params;
    if (id) {
      const qc = useQueryClient();
      void Promise.all([
        qc.prefetchQuery(getChatQueryProps(id)),
        qc.prefetchInfiniteQuery(getChatMessagesQueryProps(id)),
      ]);
    }
  },
};

export default function ChatPage() {
  const params = useParams();
  const [chatStore] = useChatStore();
  if (!params.id && chatStore.chat) {
    return <Navigate href={`/chat/${chatStore.chat.id}`} />;
  }

  return (
    <>
      <SignedIn>
        <ChatWindow chatId={params.id} />
      </SignedIn>
      <SignedOut>
        <div class="flex h-full w-full flex-col items-center justify-center">
          <SignIn />
        </div>
      </SignedOut>
    </>
  );
}
