import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_with-sidebar')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className='flex h-full w-full flex-1 flex-col'>
      <main className='flex h-full w-full flex-1 flex-col'>
        <Outlet />
      </main>
    </div>
  );
}
