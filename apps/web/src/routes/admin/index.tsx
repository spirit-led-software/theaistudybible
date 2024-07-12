import { Navigate } from '@solidjs/router';
import { Show } from 'solid-js';
import { useIsAdmin } from '~/hooks/use-is-admin';

const AdminPage = () => {
  const isAdmin = useIsAdmin();

  return (
    <Show when={isAdmin()} fallback={<Navigate href="/" />}>
      <div>Admin</div>
    </Show>
  );
};

export default AdminPage;
