import { ChatWindow } from '@/www/components/chat/window';
import { useChatStore } from '@/www/contexts/chat';
import { getChatMessagesQueryProps, getChatQueryProps } from '@/www/hooks/use-chat';
import type { RouteDefinition } from '@solidjs/router';
import { Navigate, useParams } from '@solidjs/router';
import { useQueryClient } from '@tanstack/solid-query';
import { SignedIn, SignedOut, SignIn } from 'clerk-solidjs';
import { Show } from 'solid-js';

export const route: RouteDefinition = {
  preload: async ({ params }) => {
    const { id } = params;
    if (id) {
      const qc = useQueryClient();
      await Promise.all([
        qc.prefetchQuery(getChatQueryProps(id)),
        qc.prefetchInfiniteQuery(getChatMessagesQueryProps(id)),
      ]);
    }
  },
};

export default function ChatPage() {
  const params = useParams();
  const [chatStore] = useChatStore();

  return (
    <Show
      when={!params.id && chatStore.chat}
      fallback={
        <>
          <SignedIn>
            <ChatWindow chatId={params.id} />
          </SignedIn>
          <SignedOut>
            <div class='flex h-full w-full flex-col items-center justify-center'>
              <SignIn />
            </div>
          </SignedOut>
        </>
      }
      keyed
    >
      {(chat) => <Navigate href={`/chat/${chat.id}`} />}
    </Show>
  );
}
