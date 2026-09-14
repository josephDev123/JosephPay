import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../lib/prisma/generated/client.js';
import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { errorResponse } from '../../shared/http/api-response.js';
import {
  mapKycProfile,
  type KycProfileView,
} from './mappers/kyc.mapper.js';
import { KycRepository } from './KycRepository.js';
import type { ReviewKycDto } from './dto/review-kyc.dto.js';
import type { SubmitKycDto } from './dto/submit-kyc.dto.js';

@Injectable()
export class KycService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kycRepository: KycRepository,
  ) {}

  async submit(userId: string, input: SubmitKycDto): Promise<KycProfileView> {
    try {
      const existing = await this.kycRepository.findByUserId(this.prisma, userId);

      if (existing?.status === 'VERIFIED') {
        throw new ConflictException(
          errorResponse(
            'Verified KYC cannot be resubmitted',
            'KYC_ALREADY_VERIFIED',
          ),
        );
      }

      const kyc = await this.kycRepository.upsertPending(
        this.prisma,
        userId,
        input as Prisma.InputJsonValue,
      );

      return mapKycProfile(kyc);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new NotFoundException(
          errorResponse('User not found', 'USER_NOT_FOUND'),
        );
      }

      throw error;
    }
  }

  async getByUserId(userId: string): Promise<KycProfileView> {
    const kyc = await this.kycRepository.findByUserId(this.prisma, userId);

    if (!kyc) {
      throw new NotFoundException(
        errorResponse('KYC record not found', 'KYC_NOT_FOUND'),
      );
    }

    return mapKycProfile(kyc);
  }

  async review(userId: string, input: ReviewKycDto): Promise<KycProfileView> {
    try {
      const kyc = await this.kycRepository.review(this.prisma, userId, {
        status: input.status,
        reviewNote: input.reviewNote ?? null,
      });

      return mapKycProfile(kyc);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(
          errorResponse('KYC record not found', 'KYC_NOT_FOUND'),
        );
      }

      throw error;
    }
  }
}
