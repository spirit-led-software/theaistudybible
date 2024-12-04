import { ResetPassword } from '@/www/components/auth/reset-password';
import { Meta, Title } from '@solidjs/meta';
import { Navigate, useNavigate, useSearchParams } from '@solidjs/router';
import { Show } from 'solid-js';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  return (
    <>
      <MetaTags />
      <Show when={searchParams.code} fallback={<Navigate href='/forgot-password' />} keyed>
        {(code) => <ResetPassword code={code as string} onSuccess={() => navigate('/sign-in')} />}
      </Show>
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
