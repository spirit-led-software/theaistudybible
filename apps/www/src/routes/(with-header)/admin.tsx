import { AdminSidebar } from '@/www/components/admin/sidebar';
import { Protected } from '@/www/components/auth/control';
import { SidebarProvider, SidebarTrigger } from '@/www/components/ui/sidebar';
import { useAuth } from '@/www/contexts/auth';
import { Navigate } from '@solidjs/router';
import { type JSX, Show } from 'solid-js';

export default function AdminLayout(props: { children: JSX.Element }) {
  const { isAdmin } = useAuth();
  const Unauthorized = () => <Navigate href='/' />;

  return (
    <Protected signedOutFallback={<Unauthorized />}>
      <Show when={isAdmin()} fallback={<Unauthorized />}>
        <SidebarProvider class='h-full min-h-full'>
          <AdminSidebar />
          <div class='flex h-full w-full flex-1 p-5'>
            <SidebarTrigger />
            <div class='mx-auto flex h-full w-full max-w-4xl flex-col'>{props.children}</div>
          </div>
        </SidebarProvider>
      </Show>
    </Protected>
  );
}
