import { BiblesContent } from '@/www/components/admin/bibles';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_with-sidebar/admin/bible')({
  component: RouteComponent,
});

function RouteComponent() {
  return <BiblesContent />;
}
