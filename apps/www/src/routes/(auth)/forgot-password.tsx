import { Anonymous } from '@/www/components/auth/control';
import { ForgotPassword } from '@/www/components/auth/forgot-password';
import { Meta, Title } from '@solidjs/meta';
import { Navigate } from '@solidjs/router';

export default function ForgotPasswordPage() {
  return (
    <Anonymous signedInFallback={<Navigate href='/' />}>
      <MetaTags />
      <ForgotPassword />
    </Anonymous>
  );
}

const MetaTags = () => {
  const title = 'Forgot Password | The AI Study Bible';
  const description =
    'Reset your password securely for The AI Study Bible. Our password recovery process ensures safe access to your personalized Bible study experience with AI-powered insights, notes, and study tools.';

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
