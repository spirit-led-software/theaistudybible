import { Outlet, createFileRoute } from '@tanstack/react-router';
import { NavigationHeader, NavigationHeaderProvider } from '../components/navigation/header';

export const Route = createFileRoute('/_with-header')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className='flex w-full flex-col'>
      <NavigationHeaderProvider>
        <NavigationHeader />
        <main className='flex w-full flex-1 flex-col'>
          <Outlet />
        </main>
      </NavigationHeaderProvider>
    </div>
  );
}
