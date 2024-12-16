import { Protected } from '@/www/components/auth/control';
import { getChatsQueryOptions } from '@/www/components/chat/sidebar';
import { ChatWindow } from '@/www/components/chat/window';
import { getChatMessagesQueryProps, getChatQueryProps } from '@/www/contexts/chat';
import type { RouteDefinition } from '@solidjs/router';
import { Navigate, useLocation, useParams } from '@solidjs/router';
import { useQueryClient } from '@tanstack/solid-query';

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

  return (
    <Protected
      signedOutFallback={
        <Navigate
          href={`/sign-in?redirectUrl=${encodeURIComponent(
            `/chat${params.id ? `/${params.id}` : ''}${location.search}`,
          )}`}
        />
      }
    >
      <ChatWindow id={params.id} />
    </Protected>
  );
}
