import { SignedIn, SignedOut } from '@/www/components/auth/control';
import { SignIn } from '@/www/components/auth/sign-in';
import { getChatsQueryOptions } from '@/www/components/chat/sidebar';
import { ChatWindow } from '@/www/components/chat/window';
import { useChatStore } from '@/www/contexts/chat';
import { getChatMessagesQueryProps, getChatQueryProps } from '@/www/hooks/use-chat';
import type { RouteDefinition } from '@solidjs/router';
import { Navigate, useParams, useSearchParams } from '@solidjs/router';
import { useQueryClient } from '@tanstack/solid-query';
import { Show } from 'solid-js';

export const route: RouteDefinition = {
  preload: ({ params }) => {
    const { id } = params;
    const qc = useQueryClient();
    Promise.all([
      qc.prefetchInfiniteQuery(getChatsQueryOptions()),
      qc.prefetchQuery(getChatQueryProps(id)),
      qc.prefetchInfiniteQuery(getChatMessagesQueryProps(id)),
    ]);
  },
};

export default function ChatPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const [chatStore] = useChatStore();

  return (
    <Show
      when={params.id}
      fallback={
        <Show
          when={!searchParams.query && chatStore.chatId}
          fallback={
            <>
              <SignedIn>
                <ChatWindow />
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
          {(chatId) => <Navigate href={({ location }) => `/chat/${chatId}${location.search}`} />}
        </Show>
      }
      keyed
    >
      {(id) => (
        <>
          <SignedIn>
            <ChatWindow chatId={id} />
          </SignedIn>
          <SignedOut>
            <div class='flex h-full w-full flex-col items-center justify-center'>
              <SignIn />
            </div>
          </SignedOut>
        </>
      )}
    </Show>
  );
}
