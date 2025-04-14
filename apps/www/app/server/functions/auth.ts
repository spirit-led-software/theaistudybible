import { createServerFn } from '@tanstack/react-start';
import { authMiddleware } from '../middleware/auth';

export const getAuth = createServerFn()
  .middleware([authMiddleware])
  .handler(({ context }) => {
    return {
      auth: {
        session: context.session,
        user: context.user,
        settings: context.settings,
        roles: context.roles,
      },
    };
  });
