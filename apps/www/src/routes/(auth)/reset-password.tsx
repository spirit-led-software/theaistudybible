import { ResetPassword } from '@/www/components/auth/reset-password';
import { AuthLayout } from '@/www/layouts/auth';
import { Navigate, useSearchParams } from '@solidjs/router';
import { Show } from 'solid-js';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  return (
    <AuthLayout>
      <Show when={searchParams.code} fallback={<Navigate href='/forgot-password' />} keyed>
        {(code) => <ResetPassword code={code} />}
      </Show>
    </AuthLayout>
  );
}
