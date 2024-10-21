import { ResetPassword } from '@/www/components/auth/reset-password';
import { Meta, Title } from '@solidjs/meta';
import { Navigate, useSearchParams } from '@solidjs/router';
import { Show } from 'solid-js';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  return (
    <>
      <Title>Reset Password | The AI Study Bible</Title>
      <Meta name='description' content='Reset your password for The AI Study Bible' />
      <Show when={searchParams.code} fallback={<Navigate href='/forgot-password' />} keyed>
        {(code) => <ResetPassword code={code as string} />}
      </Show>
    </>
  );
}
