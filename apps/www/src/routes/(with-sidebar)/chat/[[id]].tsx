import { getChatsQueryOptions } from '@/www/components/chat/sidebar';
import { ChatWindow } from '@/www/components/chat/window';
import { useAuth } from '@/www/contexts/auth';
import { useChatStore } from '@/www/contexts/chat';
import { getChatMessagesQueryProps, getChatQueryProps } from '@/www/hooks/use-chat';
import { useProtect } from '@/www/hooks/use-protect';
import { type RouteDefinition, useLocation, useParams } from '@solidjs/router';
import { useQueryClient } from '@tanstack/solid-query';
import { createEffect } from 'solid-js';

export const route = {
  preload: ({ params }) => {
    const { id } = params;
    const { session, user } = useAuth();
    if (session() && user()) {
      const qc = useQueryClient();
      Promise.all([
        qc.prefetchInfiniteQuery(getChatsQueryOptions()),
        qc.prefetchQuery(getChatQueryProps(id)),
        qc.prefetchInfiniteQuery(getChatMessagesQueryProps(id)),
      ]);
    }
  },
} satisfies RouteDefinition;

export default function ChatPage() {
  const params = useParams();
  const location = useLocation();
  useProtect(
    `/sign-in?redirectUrl=${encodeURIComponent(`/chat${params.id ? `/${params.id}` : ''}${location.search}`)}`,
  );

  const [, setChatStore] = useChatStore();
  createEffect(() => {
    if (params.id) {
      setChatStore('chatId', params.id);
    }
  });

  return <ChatWindow />;
}
