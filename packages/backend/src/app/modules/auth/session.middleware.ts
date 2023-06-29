import { Injectable, NestMiddleware } from '@nestjs/common';
import Session from 'supertokens-node/recipe/session';

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  async use(request: any, response: any, next: () => void) {
    if (!request.session) {
      request.session = await Session.createNewSession(request, response, crypto.randomUUID(), {
        
      });
    }
    next();
  }
}
