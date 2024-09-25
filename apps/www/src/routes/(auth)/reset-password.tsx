import { ResetPassword } from '@/www/components/auth/reset-password';
import { AuthLayout } from '@/www/layouts/auth';
import { Meta, Title } from '@solidjs/meta';
import { Navigate, useSearchParams } from '@solidjs/router';
import { Show } from 'solid-js';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  return (
    <AuthLayout>
      <Title>Reset Password | The AI Study Bible</Title>
      <Meta name='description' content='Reset your password for The AI Study Bible' />
      <Show when={searchParams.code} fallback={<Navigate href='/forgot-password' />} keyed>
        {(code) => <ResetPassword code={code} />}
      </Show>
    </AuthLayout>
  );
}
