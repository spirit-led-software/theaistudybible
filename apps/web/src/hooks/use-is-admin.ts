import { useUser } from 'clerk-solidjs';
import { createMemo } from 'solid-js';

export function useIsAdmin() {
  const { user } = useUser();

  return createMemo(() =>
    (user()?.publicMetadata.roles as string[] | undefined)?.includes('admin')
  );
}
