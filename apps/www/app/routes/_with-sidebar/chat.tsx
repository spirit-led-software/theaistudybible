import { getChatsQueryOptions } from '@/www/components/chat/sidebar';
import { ChatWindow } from '@/www/components/chat/window';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

export const Route = createFileRoute('/_with-sidebar/chat')({
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({ to: '/sign-in', search: { redirectUrl: location.href } });
    }

    const qc = context.queryClient;
    qc.prefetchInfiniteQuery(getChatsQueryOptions());
  },
  validateSearch: z.object({
    query: z.string().optional(),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <ChatWindow />;
}
