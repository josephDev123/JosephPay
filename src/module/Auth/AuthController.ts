import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
import { AuthService } from './AuthService.js';
import { successResponse } from '../../shared/http/api-response.js';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe.js';
import { AuthLoginResponseDto } from '../../docs/swagger.models.js';
import { loginSchema } from './schema/loginSchema.js';
import type { LoginDto } from './dto/login.dto.js';
import { AuthLoginRequestDto } from '../../docs/swagger.models.js';
import type { Response } from 'express';
import type { AuthLoginResult } from './AuthService.js';
import { Public } from '../../shared/decorators/auth.public.decorator.js';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Authenticate a user' })
  @ApiBody({
    type: AuthLoginRequestDto,
  })
  @ApiOkResponse({
    type: AuthLoginResponseDto,
  })
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(body);
    setAuthCookies(response, result.tokens);

    return successResponse('Login successful', result.user);
  }
}

function setAuthCookies(response: Response, tokens: AuthLoginResult['tokens']) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };

  response.cookie('access_token', tokens.accessToken, {
    ...cookieOptions,
    maxAge: tokens.accessTokenExpiresIn * 1000,
  });

  response.cookie('refresh_token', tokens.refreshToken, {
    ...cookieOptions,
    maxAge: tokens.refreshTokenExpiresIn * 1000,
  });
}
