import { Controller, All, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { auth } from './auth.js';
import { toNodeHandler } from 'better-auth/node';

const handler = toNodeHandler(auth);

@ApiExcludeController()
@Controller('auth')
export class AuthController {
  @All('*path')
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    return handler(req, res);
  }
}
