import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth')({
  beforeLoad: ({ context }) => {
    if (context.auth.user) {
      return redirect({ to: '/' });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className='flex min-h-screen items-center justify-center'>
      <Outlet />
    </div>
  );
}
