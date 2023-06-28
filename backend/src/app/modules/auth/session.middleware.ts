import { Injectable, NestMiddleware } from '@nestjs/common';
import Session from 'supertokens-node/recipe/session';

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  async createAnonymousJWT(payload: any) {
    let jwtResponse = await Session.createJWT(
      {
        ...payload,
      },
      10 * 24 * 60 * 60, // 10 days
    );
    if (jwtResponse.status === 'OK') {
      return jwtResponse.jwt;
    }
    throw new Error('Unable to create JWT. Should never come here.');
  }

  use(req: any, res: any, next: () => void) {
    const jwt = this.createAnonymousJWT({});
    req.cookies['jwt'] = jwt;
    next();
  }
}
