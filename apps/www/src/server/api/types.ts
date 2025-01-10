import type { Role } from '@/schemas/roles/types';
import type { Session, User, UserSettings } from '@/schemas/users/types';

// biome-ignore lint/complexity/noBannedTypes: <explanation>
export type Bindings = {
  //
};

export type Variables = {
  session: Session | null;
  user: User | null;
  settings: UserSettings | null;
  roles: Role[] | null;
};
