import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  Prisma,
  type Kyc,
  type User,
  type Wallet,
} from '../../lib/prisma/generated/client.js';
import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { SUPPORTED_CURRENCIES } from '../../shared/constants/currencies.js';
import { errorResponse } from '../../shared/http/api-response.js';
import { hashPassword } from '../../shared/lib/password.js';
import { KycRepository } from '../Kyc/KycRepository.js';
import { ProfileRepository } from '../Profile/profile.repository.js';
import {
  mapUserProfile,
  type UserProfileView,
  type UserRecord,
} from './mappers/user.mapper.js';
import { UserRepository } from './UserRepository.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import type { ProfileRecord } from '../Profile/mappers/profile.mapper.js';
import { EmailVerificationService } from '../email-verification/email-verification.service.js';
import type { VerifyEmailDto } from './dto/verify-email.dto.js';
import type { ResendVerificationDto } from './dto/resend-verification.dto.js';

type RegistrationResult = {
  user: UserRecord;
  profile: ProfileRecord;
  kyc: Kyc;
  wallets: Wallet[];
  verificationOtp: string;
};

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userRepository: UserRepository,
    private readonly kycRepository: KycRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  async register(input: CreateUserDto): Promise<UserProfileView> {
    try {
      const passwordHash = await hashPassword(input.password);

      const result = await this.prisma.$transaction(async (database) => {
        const existingUser = await this.userRepository.findByEmail(
          input.email,
          database,
        );

        if (existingUser) {
          throw new ConflictException(
            errorResponse('Email already exists', 'USER_EMAIL_EXISTS', [
              'A user with this email already exists',
            ]),
          );
        }

        const user = await this.userRepository.createUser(database, {
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          middleName: input.middleName,
          passwordHash,
        });

        const profile = await this.profileRepository.createEmpty(
          database,
          user.id,
        );
        const kyc = await this.kycRepository.createPending(database, user.id);
        const wallets = await this.userRepository.createWallets(
          database,
          user.id,
        );
        const verificationOtp =
          await this.emailVerificationService.createVerification(database, {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
          });

        return {
          user,
          profile,
          kyc,
          wallets,
          verificationOtp,
        } satisfies RegistrationResult;
      });

      await this.emailVerificationService.sendVerificationEmail(
        {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
        },
        result.verificationOtp,
      );

      return mapUserProfile({
        ...result.user,
        profile: result.profile,
        wallets: result.wallets,
        kyc: result.kyc,
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          errorResponse('Email already exists', 'USER_EMAIL_EXISTS'),
        );
      }

      throw error;
    }
  }

  async verifyEmail(input: VerifyEmailDto): Promise<UserProfileView> {
    return this.emailVerificationService.verifyEmail(input);
  }

  async resendVerification(
    input: ResendVerificationDto,
  ): Promise<{ email: string }> {
    return this.emailVerificationService.resendVerification({
      email: input.email,
    });
  }

  async getProfile(id: string | undefined): Promise<UserProfileView> {
    if (!id) {
      throw new UnauthorizedException(
        errorResponse('User authentication is required', 'UNAUTHORIZED'),
      );
    }
    const user = await this.userRepository.findById(this.prisma, id);

    if (!user) {
      throw new NotFoundException(
        errorResponse('User not found', 'USER_NOT_FOUND', [
          'No user exists for the provided identifier',
        ]),
      );
    }

    return mapUserProfile(user);
  }

  async listWallets(userId: string) {
    return this.userRepository.findWalletsByUserId(this.prisma, userId);
  }

  async ensureWalletsExist(userId: string) {
    const wallets = await this.listWallets(userId);

    if (wallets.length === SUPPORTED_CURRENCIES.length) {
      return wallets;
    }

    return this.prisma.$transaction(async (database) => {
      return this.userRepository.createWallets(database, userId);
    });
  }
}
