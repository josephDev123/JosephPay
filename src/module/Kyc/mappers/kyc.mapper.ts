import type { Kyc } from '../../../lib/prisma/generated/client.js';

export interface KycProfileView {
  id: string;
  userId: string;
  status: Kyc['status'];
  // submittedData: Kyc['submittedData'];
  reviewNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  documentType: Kyc['documentType'];
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  dateOfBirth?: Date | null;
  nationality?: string | null;
  documentNumber?: string | null;
  documentIssueDate?: Date | null;
  documentExpiryDate?: Date | null;
  provider?: Kyc['provider'] | null;
  providerReference?: string | null;
  // providerResponse: JsonValue | null;
}

export function mapKycProfile(kyc: Kyc): KycProfileView {
  return {
    id: kyc.id,
    userId: kyc.userId,
    status: kyc.status,
    documentType: kyc.documentType,
    // submittedData: kyc.submittedData,
    reviewNote: kyc.reviewNote,
    reviewedAt: kyc.reviewedAt,
    createdAt: kyc.createdAt,
    updatedAt: kyc.updatedAt,
  };
}
