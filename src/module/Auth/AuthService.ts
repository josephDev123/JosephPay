import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { errorResponse } from '../../shared/http/api-response.js';
import { getAppConfig } from '../../shared/lib/app-config.js';
import { verifyPassword } from '../../shared/lib/password.js';
import {
  mapUserProfile,
  type UserProfileView,
} from '../User/mappers/user.mapper.js';
import { AuthRepository } from './AuthRepository.js';
import type { LoginDto } from './dto/login.dto.js';
import type { Kyc, Wallet } from '../../lib/prisma/generated/client.js';
import type { ProfileRecord } from '../Profile/mappers/profile.mapper.js';
import type { UserRecord } from '../User/mappers/user.mapper.js';

export type JwtTokenPair = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
};

export type AuthLoginResult = {
  user: UserProfileView;
  tokens: JwtTokenPair;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(input: LoginDto): Promise<AuthLoginResult> {
    const user = await this.authRepository.findByEmail(input.email);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException(
        errorResponse('Invalid credentials', 'INVALID_CREDENTIALS'),
      );
    }

    const isPasswordValid = await verifyPassword(
      input.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        errorResponse('Invalid credentials', 'INVALID_CREDENTIALS'),
      );
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException(
        errorResponse('Email address is not verified', 'EMAIL_NOT_VERIFIED'),
      );
    }

    const authConfig = getAppConfig();
    const accessTokenExpiresIn = parseDurationToSeconds(
      authConfig.accessTokenTtl || '',
    );
    const refreshTokenExpiresIn = parseDurationToSeconds(
      authConfig.refreshTokenTtl || '',
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: user.id,
          email: user.email,
          typ: 'access',
        },
        {
          secret: authConfig.accessTokenSecret,
          expiresIn: accessTokenExpiresIn,
        },
      ),
      this.jwtService.signAsync(
        {
          sub: user.id,
          email: user.email,
          typ: 'refresh',
        },
        {
          secret: authConfig.refreshTokenSecret,
          expiresIn: refreshTokenExpiresIn,
        },
      ),
    ]);

    return {
      user: mapUserProfile(
        user as UserRecord & {
          passwordHash: string | null;
          wallets: Wallet[];
          kyc: Kyc | null;
          profile: ProfileRecord | null;
        },
      ),
      tokens: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        accessTokenExpiresIn,
        refreshTokenExpiresIn,
      },
    };
  }
}

function parseDurationToSeconds(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration);

  if (!match) {
    throw new Error(`Invalid token duration: ${duration}`);
  }

  const amount = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      return amount;
    case 'm':
      return amount * 60;
    case 'h':
      return amount * 60 * 60;
    case 'd':
      return amount * 60 * 60 * 24;
    default:
      throw new Error(`Unsupported token duration unit: ${unit}`);
  }
}
