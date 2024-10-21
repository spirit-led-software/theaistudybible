import { ForgotPassword } from '@/www/components/auth/forgot-password';
import { Meta, Title } from '@solidjs/meta';

export default function ForgotPasswordPage() {
  return (
    <>
      <Title>Forgot Password | The AI Study Bible</Title>
      <Meta name='description' content='Forgot your password for The AI Study Bible' />
      <ForgotPassword />
    </>
  );
}
