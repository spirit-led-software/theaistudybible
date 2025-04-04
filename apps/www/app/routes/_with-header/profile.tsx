import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_with-header/profile')({
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({ to: '/sign-in', search: { redirectUrl: location.href } });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
