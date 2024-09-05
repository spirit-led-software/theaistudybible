import { ChatWindow } from '@/www/components/chat/window';
import { getChatMessagesQueryProps, getChatQueryProps } from '@/www/hooks/use-chat';
import type { RouteDefinition} from '@solidjs/router';
import { useParams } from '@solidjs/router';
import { useQueryClient } from '@tanstack/solid-query';
import { SignedIn, SignedOut, SignIn } from 'clerk-solidjs';

export const route: RouteDefinition = {
  preload: ({ params }) => {
    const { id } = params;
    const qc = useQueryClient();
    void Promise.all([
      qc.prefetchQuery(getChatQueryProps(id)),
      qc.prefetchInfiniteQuery(getChatMessagesQueryProps(id)),
    ]);
  },
};

export default function ChatPage() {
  const params = useParams();
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
