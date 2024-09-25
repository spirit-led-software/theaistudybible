import { SignIn } from '@/www/components/auth/sign-in';
import { AuthLayout } from '@/www/layouts/auth';
import { Meta, Title } from '@solidjs/meta';

export default function SignInPage() {
  return (
    <AuthLayout>
      <Title>Sign In | The AI Study Bible</Title>
      <Meta name='description' content='Sign in to The AI Study Bible' />
      <SignIn />
    </AuthLayout>
  );
}
