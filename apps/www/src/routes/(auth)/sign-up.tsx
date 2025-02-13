import { SignUp } from '@/www/components/auth/sign-up';
import { useProtectAnonymous } from '@/www/hooks/use-protect';
import { Meta, Title } from '@solidjs/meta';
import { useSearchParams } from '@solidjs/router';

export default function SignUpPage() {
  const [searchParams] = useSearchParams();
  useProtectAnonymous(searchParams.redirectUrl as string | undefined);

  return (
    <>
      <MetaTags />
      <SignUp redirectUrl={searchParams.redirectUrl as string | undefined} />
    </>
  );
}

const MetaTags = () => {
  const title = 'Sign Up | The AI Study Bible';
  const description =
    'Create your free account on The AI Study Bible - Discover AI-powered Bible study tools, personalized insights, and a revolutionary way to explore Scripture. Join our community today!';

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
