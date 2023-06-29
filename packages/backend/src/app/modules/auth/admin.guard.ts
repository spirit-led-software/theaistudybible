import { ExecutionContext, Injectable } from '@nestjs/common';
import { SessionContainer } from 'supertokens-node/recipe/session';
import { UserRoleClaim } from 'supertokens-node/recipe/userroles';
import { AuthGuard } from './auth.guard';

@Injectable()
export class AdminGuard extends AuthGuard {
  constructor() {
    super({ sessionRequired: true });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!super.canActivate(context)) {
      return false;
    }
    const session: SessionContainer = context
      .switchToHttp()
      .getRequest().session;
    const roles = await session.getClaimValue(UserRoleClaim);
    if (!roles.includes('admin')) {
      return false;
    }
  }
}
