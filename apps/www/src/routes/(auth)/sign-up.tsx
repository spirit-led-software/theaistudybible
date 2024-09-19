import { SignUp } from '@/www/components/auth/sign-up';
import { AuthLayout } from '@/www/layouts/auth';

export default function SignUpPage() {
  return (
    <AuthLayout>
      <SignUp />
    </AuthLayout>
  );
}
