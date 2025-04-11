import { AdminSidebar } from '@/www/components/admin/sidebar';
import { SidebarProvider, SidebarTrigger } from '@/www/components/ui/sidebar';
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { useMemo } from 'react';
import { useWindowSize } from 'usehooks-ts';

export const Route = createFileRoute('/_with-sidebar/admin')({
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({ to: '/sign-in', search: { redirectUrl: location.href } });
    }

    if (!context.roles?.some((role) => role.id === 'admin')) {
      throw redirect({ to: '/' });
    }

    if (location.pathname === '/admin') {
      throw redirect({ to: '/admin/devotion' });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const windowSize = useWindowSize();
  const isMobile = useMemo(() => windowSize.width < 768, [windowSize]);

  return (
    <SidebarProvider
      className='min-h-full flex-1 overflow-hidden'
      style={
        {
          '--sidebar-width': '20rem',
        } as React.CSSProperties
      }
      defaultOpen={!isMobile}
    >
      <AdminSidebar />
      <div className='flex h-full w-full flex-1 p-5'>
        <SidebarTrigger />
        <div className='mx-auto flex h-full w-full flex-col'>
          <Outlet />
        </div>
      </div>
    </SidebarProvider>
  );
}
