import { SignUp } from '@/www/components/auth/sign-up';
import { Meta, Title } from '@solidjs/meta';

export default function SignUpPage() {
  return (
    <>
      <Title>Sign Up | The AI Study Bible</Title>
      <Meta name='description' content='Sign up for The AI Study Bible' />
      <SignUp />
    </>
  );
}
