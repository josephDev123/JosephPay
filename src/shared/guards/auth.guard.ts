import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtPayload } from '../types/auth.jwt.payload.js';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/auth.public.decorator.js';
import { getAppConfig } from '../lib/app-config.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      // 💡 See this condition
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    // const token = this.extractTokenFromHeader(request);
    // from cookie
    const access_token = request.cookies?.access_token;
    // console.log('token', access_token);
    if (!access_token) {
      throw new UnauthorizedException();
    }
    try {
      // 💡 Here the JWT secret key that's used for verifying the payload
      // is the key that was passed in the JwtModule
      const authConfig = getAppConfig();
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        access_token,
        { secret: authConfig.accessTokenSecret },
      );
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      // console.log('payload', payload);
      request.user = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
}
