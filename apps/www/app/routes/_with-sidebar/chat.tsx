import { ChatWindow } from '@/www/components/chat/window';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

export const Route = createFileRoute('/_with-sidebar/chat')({
  params: z.object({
    id: z.string().optional(),
  }),
  validateSearch: z.object({
    query: z.string().optional(),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <ChatWindow />;
}
