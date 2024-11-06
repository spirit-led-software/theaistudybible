import { SignIn } from '@/www/components/auth/sign-in';
import { Meta, Title } from '@solidjs/meta';

export default function SignInPage() {
  return (
    <>
      <MetaTags />
      <SignIn />
    </>
  );
}

const MetaTags = () => {
  const title = 'Sign In | The AI Study Bible';
  const description =
    'Sign in to access your personalized Bible study experience with AI-powered insights, verse explanations, notes, and study tools. The AI Study Bible helps you understand Scripture deeper through intelligent assistance.';

  return (
    <>
      <Title>{title}</Title>
      <Meta name='description' content={description} />
      <Meta property='og:title' content={title} />
      <Meta property='og:description' content={description} />
      <Meta name='twitter:card' content='summary' />
      <Meta name='twitter:title' content={title} />
      <Meta name='twitter:description' content={description} />
    </>
  );
};
