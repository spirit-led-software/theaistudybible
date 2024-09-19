import { SignIn } from '@/www/components/auth/sign-in';
import { AuthLayout } from '@/www/layouts/auth';

export default function SignInPage() {
  return (
    <AuthLayout>
      <SignIn />
    </AuthLayout>
  );
}
