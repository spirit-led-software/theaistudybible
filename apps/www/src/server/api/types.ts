import type { Role } from '@/schemas/roles/types';
import type { Session, User } from 'lucia';

// biome-ignore lint/complexity/noBannedTypes: <explanation>
export type Bindings = {
  //
};

export type Variables = {
  session: Session | null;
  user: User | null;
  roles: Role[] | null;
};
