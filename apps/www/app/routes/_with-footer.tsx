import { NavigationFooter } from '@/www/components/navigation/footer';
import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_with-footer')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <div className='flex min-h-full w-full flex-1 flex-col'>
        <Outlet />
      </div>
      <NavigationFooter />
    </>
  );
}
