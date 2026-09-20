import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Kyc, Prisma } from '../../lib/prisma/generated/client.js';
import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { errorResponse } from '../../shared/http/api-response.js';
import { mapKycProfile, type KycProfileView } from './mappers/kyc.mapper.js';
import { KycRepository } from './KycRepository.js';
import type { ReviewKycDto } from './dto/review-kyc.dto.js';
import type { SubmitKycDto } from './dto/submit-kyc.dto.js';
import type { KycProvider } from './adapters/kycs-provider-interface.js';
import { KYC_PROVIDER } from './constants/kyc.token.js';

export type IdentityType = Omit<
  Kyc,
  'id' | 'userId' | 'reviewNote' | 'reviewedAt' | 'createdAt' | 'updatedAt'
>;
@Injectable()
export class KycService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kycRepository: KycRepository,
    @Inject(KYC_PROVIDER)
    private readonly kycProvider: KycProvider,
  ) {}

  async submit(userId: string, input: SubmitKycDto): Promise<KycProfileView> {
    try {
      const existing = await this.kycRepository.findByUserId(
        this.prisma,
        userId,
      );

      if (existing?.status === 'VERIFIED') {
        throw new ConflictException(
          errorResponse(
            'Verified KYC cannot be resubmitted',
            'KYC_ALREADY_VERIFIED',
          ),
        );
      }

      const kycIdentity = await this.kycProvider.verifyKYCIdentity({
        value: input.value,
      });

      const identity: IdentityType = {
        status: 'VERIFIED',
        documentType: input.documentType,
        firstName: kycIdentity.firstName,
        middleName: kycIdentity.middleName,
        lastName: kycIdentity.lastName,
        dateOfBirth: kycIdentity.dateOfBirth,
        nationality: kycIdentity.nationality,
        documentNumber: kycIdentity.documentNumber,
        documentIssueDate: kycIdentity.documentIssueDate,
        documentExpiryDate: kycIdentity.documentExpiryDate,
        provider: 'DOJAH',
        providerReference: kycIdentity.providerReference,
        providerResponse: kycIdentity.providerResponse,
      };

      const kyc = await this.kycRepository.upsertPending(
        this.prisma,
        userId,
        identity,
        // input as Prisma.InputJsonValue,
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
