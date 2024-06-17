import { RouteDefinition, useParams } from '@solidjs/router';
import { useQueryClient } from '@tanstack/solid-query';
import { Show } from 'solid-js';
import { ChatWindow } from '~/components/chat/window';
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
    <Show when={params.id} keyed>
      <ChatWindow chatId={params.id} />
    </Show>
  );
}
