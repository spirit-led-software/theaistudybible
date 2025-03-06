import { NavigationHeader } from '@/www/components/navigation/header';
import { NavigationHeaderProvider } from '@/www/components/navigation/header';
import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_with-footer/_with-header')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className='flex w-full flex-1 flex-col'>
      <NavigationHeaderProvider>
        <NavigationHeader />
        <main className='flex w-full flex-1 flex-col'>
          <Outlet />
        </main>
      </NavigationHeaderProvider>
    </div>
  );
}
