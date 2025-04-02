import { ResetPassword } from '@/www/components/auth/reset-password';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useNavigate } from '@tanstack/react-router';
import { z } from 'zod';

export const Route = createFileRoute('/_auth/reset-password')({
  head: () => {
    const title = 'Reset Password';
    const description =
      'Reset your password securely for The AI Study Bible. Our password reset process ensures safe access to your personalized Bible study experience with AI-powered insights, notes, and study tools.';
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { name: 'og:title', content: title },
        { name: 'og:description', content: description },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
    };
  },
  validateSearch: z.object({
    code: z.string(),
  }),
  beforeLoad(ctx) {
    if (!ctx.search.code) {
      throw redirect({ to: '/forgot-password' });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  return <ResetPassword code={search.code} onSuccess={() => navigate({ to: '/sign-in' })} />;
}
