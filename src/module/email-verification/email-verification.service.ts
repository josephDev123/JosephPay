import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '../../lib/prisma/generated/client.js';
import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { errorResponse } from '../../shared/http/api-response.js';
import {
  EMAIL_VERIFICATION_MAX_ATTEMPTS,
  EMAIL_VERIFICATION_OTP_TTL_MINUTES,
  generateVerificationOtp,
  hashOtp,
  verifyOtp,
} from '../../shared/lib/otp.js';
import { ResendMailService } from '../../shared/mail/resend-mail.service.js';
import { UserRepository } from '../User/UserRepository.js';
import {
  mapUserProfile,
  type UserProfileView,
} from '../User/mappers/user.mapper.js';
import { EmailVerificationRepository } from './email-verification.repository.js';
import type { VerifyEmailDto } from '../User/dto/verify-email.dto.js';

type VerificationIssuer = {
  id: string;
  email: string;
  firstName: string;
};

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userRepository: UserRepository,
    private readonly emailVerificationRepository: EmailVerificationRepository,
    private readonly resendMailService: ResendMailService,
  ) {}

  async createVerification(
    database: PrismaService | Prisma.TransactionClient,
    user: VerificationIssuer,
  ): Promise<string> {
    const otp = generateVerificationOtp();
    const otpHash = await hashOtp(otp);
    const expiresAt = this.buildExpiresAt();

    await this.emailVerificationRepository.upsertPending(database, {
      userId: user.id,
      otpHash,
      expiresAt,
    });

    return otp;
  }

  async sendVerificationEmail(
    user: VerificationIssuer,
    otp: string,
  ): Promise<void> {
    await this.resendMailService.sendEmailVerificationOtp({
      email: user.email,
      firstName: user.firstName,
      otp,
    });
  }

  async verifyEmail(input: VerifyEmailDto): Promise<UserProfileView> {
    const user = await this.userRepository.findByEmail(
      input.email,
      this.prisma,
    );

    if (!user) {
      throw new NotFoundException(
        errorResponse('User not found', 'USER_NOT_FOUND', [
          'No user exists for the provided email address',
        ]),
      );
    }

    if (user.emailVerifiedAt) {
      const verifiedUser = await this.userRepository.findById(
        this.prisma,
        user.id,
      );

      if (!verifiedUser) {
        throw new NotFoundException(
          errorResponse('User not found', 'USER_NOT_FOUND'),
        );
      }

      return mapUserProfile(verifiedUser);
    }

    return this.prisma.$transaction(async (database) => {
      const verification =
        await this.emailVerificationRepository.findByUserIdForUpdate(
          database,
          user.id,
        );

      if (!verification) {
        throw new NotFoundException(
          errorResponse(
            'Email verification not found',
            'EMAIL_VERIFICATION_NOT_FOUND',
          ),
        );
      }

      const now = new Date();

      if (verification.expiresAt <= now) {
        await this.emailVerificationRepository.deleteByUserId(
          database,
          user.id,
        );
        throw new UnauthorizedException(
          errorResponse('OTP has expired', 'EMAIL_OTP_EXPIRED'),
        );
      }

      const isOtpValid = await verifyOtp(input.otp, verification.otpHash);
      console.log('isOtpValid', isOtpValid);

      if (!isOtpValid) {
        const nextAttempts = verification.attempts + 1;

        if (nextAttempts >= EMAIL_VERIFICATION_MAX_ATTEMPTS) {
          await this.emailVerificationRepository.deleteByUserId(
            database,
            user.id,
          );
          throw new UnauthorizedException(
            errorResponse(
              'OTP attempts exceeded',
              'EMAIL_OTP_ATTEMPTS_EXCEEDED',
            ),
          );
        }

        await this.emailVerificationRepository.incrementAttempts(
          database,
          user.id,
        );
        throw new UnauthorizedException(
          errorResponse('Invalid OTP', 'EMAIL_OTP_INVALID'),
        );
      }

      await this.userRepository.markEmailVerified(database, user.id, now);
      await this.emailVerificationRepository.deleteByUserId(database, user.id);

      const verifiedUser = await this.userRepository.findById(
        database,
        user.id,
      );

      if (!verifiedUser) {
        throw new NotFoundException(
          errorResponse('User not found', 'USER_NOT_FOUND'),
        );
      }

      return mapUserProfile(verifiedUser);
    });
  }

  async resendVerification(input: {
    email: string;
  }): Promise<{ email: string }> {
    const user = await this.userRepository.findByEmail(
      input.email,
      this.prisma,
    );

    if (!user) {
      throw new NotFoundException(
        errorResponse('User not found', 'USER_NOT_FOUND', [
          'No user exists for the provided email address',
        ]),
      );
    }

    if (user.emailVerifiedAt) {
      return {
        email: user.email,
      };
    }

    const otp = await this.prisma.$transaction(async (database) => {
      return this.createVerification(database, {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
      });
    });

    await this.sendVerificationEmail(
      {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
      },
      otp,
    );

    return {
      email: user.email,
    };
  }

  buildExpiresAt(): Date {
    return new Date(
      Date.now() + EMAIL_VERIFICATION_OTP_TTL_MINUTES * 60 * 1000,
    );
  }
}
