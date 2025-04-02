import { ForgotPassword } from '@/www/components/auth/forgot-password';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/forgot-password')({
  head: () => {
    const title = 'Forgot Password';
    const description =
      'Reset your password securely for The AI Study Bible. Our password recovery process ensures safe access to your personalized Bible study experience with AI-powered insights, notes, and study tools.';
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
  component: RouteComponent,
});

function RouteComponent() {
  return <ForgotPassword />;
}
