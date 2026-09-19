import { Injectable } from '@nestjs/common';
import {
  Prisma,
  PrismaClient,
  type KycDocumentType,
  type Kyc,
} from '../../lib/prisma/generated/client.js';
import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { IdentityType } from './KycService.js';

type DatabaseClient = PrismaService | PrismaClient | Prisma.TransactionClient;

@Injectable()
export class KycRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(database: DatabaseClient, userId: string) {
    return database.kyc.findUnique({
      where: {
        userId,
      },
    });
  }

  createPending(
    database: DatabaseClient,
    userId: string,
    documentType: KycDocumentType = 'BVN',
    // submittedData: Prisma.InputJsonValue | null = null,
  ) {
    return database.kyc.create({
      data: {
        userId,
        documentType,
        status: 'PENDING',
        // submittedData: submittedData ?? undefined,
      },
    });
  }

  upsertPending(
    database: DatabaseClient,
    userId: string,
    // submittedData: Prisma.InputJsonValue,
    kycIdentityData: IdentityType,
  ) {
    // const documentType = this.getDocumentType(submittedData);
    const providerResponse = (kycIdentityData.providerResponse ??
      Prisma.JsonNull) as Prisma.InputJsonValue;

    return database.kyc.upsert({
      where: {
        userId,
      },
      create: {
        userId,
        documentType: kycIdentityData.documentType,
        status: kycIdentityData.status,
        dateOfBirth: kycIdentityData.dateOfBirth,
        firstName: kycIdentityData.firstName,
        lastName: kycIdentityData.lastName,
        middleName: kycIdentityData.middleName,
        nationality: kycIdentityData.nationality,
        documentExpiryDate: kycIdentityData.documentExpiryDate,
        documentIssueDate: kycIdentityData.documentIssueDate,
        documentNumber: kycIdentityData.documentNumber,
        provider: kycIdentityData.provider,
        providerReference: kycIdentityData.providerReference,
        providerResponse,
        reviewedAt: null,
        reviewNote: null,
      },
      update: {
        documentType: kycIdentityData.documentType,
        status: kycIdentityData.status,
        dateOfBirth: kycIdentityData.dateOfBirth,
        firstName: kycIdentityData.firstName,
        lastName: kycIdentityData.lastName,
        middleName: kycIdentityData.middleName,
        nationality: kycIdentityData.nationality,
        documentExpiryDate: kycIdentityData.documentExpiryDate,
        documentIssueDate: kycIdentityData.documentIssueDate,
        documentNumber: kycIdentityData.documentNumber,
        provider: kycIdentityData.provider,
        providerReference: kycIdentityData.providerReference,
        providerResponse,
        reviewNote: null,
        reviewedAt: null,
      },
    });
  }

  private getDocumentType(
    submittedData: Prisma.InputJsonValue,
  ): KycDocumentType {
    if (
      typeof submittedData === 'object' &&
      submittedData !== null &&
      !Array.isArray(submittedData) &&
      'documentType' in submittedData
    ) {
      const documentType = submittedData.documentType;

      if (
        typeof documentType === 'string' &&
        this.isDocumentType(documentType)
      ) {
        return documentType;
      }
    }

    return 'NIN';
  }

  private isDocumentType(value: string): value is KycDocumentType {
    return [
      'NIN',
      'PASSPORT',
      'BVN',
      'DRIVERS_LICENSE',
      'VOTERS_CARD',
      'NATIONAL_ID_CARD',
    ].includes(value);
  }

  review(
    database: DatabaseClient,
    userId: string,
    data: Pick<Kyc, 'status' | 'reviewNote'>,
  ) {
    return database.kyc.update({
      where: {
        userId,
      },
      data: {
        status: data.status,
        reviewNote: data.reviewNote,
        reviewedAt: new Date(),
      },
    });
  }
}
