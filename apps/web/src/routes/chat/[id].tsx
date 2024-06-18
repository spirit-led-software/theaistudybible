import { RouteDefinition, useParams } from '@solidjs/router';
import { useQueryClient } from '@tanstack/solid-query';
import { ChatWindow } from '~/components/chat/window';
import { SignIn, SignedIn, SignedOut } from '~/components/clerk';
import { getChatMessagesQueryProps, getChatQueryProps } from '~/hooks/chat';

export const route: RouteDefinition = {
  load: ({ params }) => {
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
