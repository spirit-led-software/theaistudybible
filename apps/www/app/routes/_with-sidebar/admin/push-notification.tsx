import { PushNotificationContent } from '@/www/components/admin/push-notification';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_with-sidebar/admin/push-notification')({
  component: RouteComponent,
});

function RouteComponent() {
  return <PushNotificationContent />;
}
