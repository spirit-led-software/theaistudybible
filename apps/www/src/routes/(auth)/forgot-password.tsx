import { ForgotPassword } from '@/www/components/auth/forgot-password';
import { AuthLayout } from '@/www/layouts/auth';

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPassword />
    </AuthLayout>
  );
}
