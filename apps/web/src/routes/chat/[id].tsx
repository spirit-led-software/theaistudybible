import { RouteDefinition, useParams } from '@solidjs/router';
import { useQueryClient } from '@tanstack/solid-query';
import { SignedIn, SignedOut, SignIn } from 'clerk-solidjs';
import { ChatWindow } from '~/components/chat/window';
import { getChatMessagesQueryProps, getChatQueryProps } from '~/hooks/use-chat';

export const route: RouteDefinition = {
  preload: ({ params }) => {
    const { id } = params;
    const qc = useQueryClient();
    Promise.all([
      qc.prefetchQuery(getChatQueryProps(id)),
      qc.prefetchInfiniteQuery(getChatMessagesQueryProps(id))
    ]);
  }
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
