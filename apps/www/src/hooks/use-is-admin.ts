import { createMemo } from 'solid-js';
import { useAuth } from '../contexts/auth';

export function useIsAdmin() {
  const { roles } = useAuth();

  return createMemo(() => roles()?.some((role) => role.id === 'admin') ?? false);
}
