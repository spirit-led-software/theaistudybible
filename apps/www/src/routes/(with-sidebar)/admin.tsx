import { AdminSidebar } from '@/www/components/admin/sidebar';
import { SidebarProvider, SidebarTrigger } from '@/www/components/ui/sidebar';
import { useProtectAdmin } from '@/www/hooks/use-protect';
import { useWindowSize } from '@solid-primitives/resize-observer';
import { type JSX, createMemo } from 'solid-js';

export default function AdminLayout(props: { children: JSX.Element }) {
  useProtectAdmin('/');

  const windowSize = useWindowSize();
  const isMobile = createMemo(() => windowSize.width < 768);

  return (
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
  );
}
