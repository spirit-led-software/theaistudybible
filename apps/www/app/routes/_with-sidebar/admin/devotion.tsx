import { DevotionsContent } from '@/www/components/admin/devotions';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_with-sidebar/admin/devotion')({
  component: RouteComponent,
});

function RouteComponent() {
  return <DevotionsContent />;
}
