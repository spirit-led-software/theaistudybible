import { AdminSidebar } from '@/www/components/admin/sidebar';
import { Protected } from '@/www/components/auth/control';
import { SidebarProvider, SidebarTrigger } from '@/www/components/ui/sidebar';
import { useAuth } from '@/www/contexts/auth';
import { useWindowSize } from '@solid-primitives/resize-observer';
import { Navigate } from '@solidjs/router';
import { type JSX, Show, createMemo } from 'solid-js';

export default function AdminLayout(props: { children: JSX.Element }) {
  const { isAdmin } = useAuth();
  const Unauthorized = () => <Navigate href='/' />;
  const windowSize = useWindowSize();
  const isMobile = createMemo(() => windowSize.width < 768);

  return (
    <Protected signedOutFallback={<Unauthorized />}>
      <Show when={isAdmin()} fallback={<Unauthorized />}>
        <SidebarProvider
          class='min-h-full flex-1 overflow-hidden'
          style={{
            '--sidebar-width': '20rem',
          }}
          defaultOpen={!isMobile()}
        >
          <AdminSidebar />
          <div class='flex h-full w-full flex-1 p-5'>
            <SidebarTrigger />
            <div class='mx-auto flex h-full w-full flex-col'>{props.children}</div>
          </div>
        </SidebarProvider>
      </Show>
    </Protected>
  );
}
