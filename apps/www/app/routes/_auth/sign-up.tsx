import { SignUp } from '@/www/components/auth/sign-up';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

export const Route = createFileRoute('/_auth/sign-up')({
  head: () => {
    const title = 'Sign Up | The AI Study Bible';
    const description =
      'Create your free account on The AI Study Bible - Discover AI-powered Bible study tools, personalized insights, and a revolutionary way to explore Scripture. Join our community today!';
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
  return <SignUp redirectUrl={search.redirectUrl} />;
}
