import { SignedIn } from '@/www/components/auth/control';
import { getChatsQueryOptions } from '@/www/components/chat/sidebar';
import { ChatWindow } from '@/www/components/chat/window';
import { useChatStore } from '@/www/contexts/chat';
import { getChatMessagesQueryProps, getChatQueryProps } from '@/www/hooks/use-chat';
import type { RouteDefinition } from '@solidjs/router';
import { Navigate, useLocation, useParams } from '@solidjs/router';
import { useQueryClient } from '@tanstack/solid-query';
import { createEffect } from 'solid-js';

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
  const location = useLocation();

  const [, setChatStore] = useChatStore();
  createEffect(() => {
    setChatStore('chatId', params.id ?? null);
  });

  return (
    <SignedIn
      fallback={
        <Navigate
          href={`/sign-in?redirectUrl=${encodeURIComponent(`/chat/${params.id}${location.search}`)}`}
        />
      }
    >
      <ChatWindow />
    </SignedIn>
  );
}
