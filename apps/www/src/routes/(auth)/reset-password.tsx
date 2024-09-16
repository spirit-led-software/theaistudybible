import { ResetPassword } from '@/www/components/auth/reset-password';
import { Navigate, useSearchParams } from '@solidjs/router';
import { Show } from 'solid-js';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  return (
    <Show when={searchParams.code} fallback={<Navigate href='/forgot-password' />} keyed>
      {(code) => <ResetPassword code={code} />}
    </Show>
  );
}
