import { ResetPassword } from '@/www/components/auth/reset-password';
import { useProtectAnonymous } from '@/www/hooks/use-protect';
import { Meta, Title } from '@solidjs/meta';
import { useLocation, useNavigate, useSearchParams } from '@solidjs/router';
import { createEffect } from 'solid-js';
export default function ResetPasswordPage() {
  useProtectAnonymous();

  const navigate = useNavigate();
  const location = useLocation();
  createEffect(() => {
    if (!location.query.code) {
      navigate('/forgot-password');
    }
  });

  const [searchParams] = useSearchParams();

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
