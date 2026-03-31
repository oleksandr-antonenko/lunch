import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { auth } from './auth.js';
import { fromNodeHeaders } from 'better-auth/node';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  async use(req: Request, _res: Response, next: NextFunction) {
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });
      if (session) {
        (req as Request & { user?: unknown; session?: unknown }).user =
          session.user;
        (req as Request & { session?: unknown }).session = session.session;
      }
    } catch {
      // No valid session — continue without user
    }
    next();
  }
}
