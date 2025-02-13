import { ResetPassword } from '@/www/components/auth/reset-password';
import { useProtectAnonymous } from '@/www/hooks/use-protect';
import { Meta, Title } from '@solidjs/meta';
import { Navigate, useLocation, useNavigate, useSearchParams } from '@solidjs/router';

export default function ResetPasswordPage() {
  useProtectAnonymous();

  const location = useLocation();
  if (!location.query.code) return <Navigate href='/forgot-password' />;

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  return (
    <>
      <MetaTags />
      <ResetPassword code={searchParams.code as string} onSuccess={() => navigate('/sign-in')} />
    </>
  );
}

const MetaTags = () => {
  const title = 'Reset Password | The AI Study Bible';
  const description =
    'Reset your password securely for The AI Study Bible. Our password reset process ensures safe access to your personalized Bible study experience with AI-powered insights, notes, and study tools.';

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
