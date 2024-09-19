import { SignedIn, SignedOut } from '@/www/components/auth/control';
import { SignIn } from '@/www/components/auth/sign-in';
import { ChatWindow } from '@/www/components/chat/window';
import { useChatStore } from '@/www/contexts/chat';
import { getChatMessagesQueryProps, getChatQueryProps } from '@/www/hooks/use-chat';
import { WithHeaderLayout } from '@/www/layouts/with-header';
import type { RouteDefinition } from '@solidjs/router';
import { Navigate, useParams } from '@solidjs/router';
import { useQueryClient } from '@tanstack/solid-query';
import { Show } from 'solid-js';

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

  return (
    <WithHeaderLayout>
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
    </WithHeaderLayout>
  );
}
