import { SignIn } from '@/www/components/auth/sign-in';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

export const Route = createFileRoute('/_auth-pages/sign-in')({
  head: () => {
    const title = 'Sign In | The AI Study Bible';
    const description =
      'Sign in to access your personalized Bible study experience with AI-powered insights, verse explanations, notes, and study tools. The AI Study Bible helps you understand Scripture deeper through intelligent assistance.';
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
    redirectUrl: z.string().optional(),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();

  return <SignIn redirectUrl={search.redirectUrl} />;
}
