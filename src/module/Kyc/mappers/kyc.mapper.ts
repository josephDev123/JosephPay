import type { Kyc } from '../../../lib/prisma/generated/client.js';

export interface KycProfileView {
  id: string;
  userId: string;
  status: Kyc['status'];
  submittedData: Kyc['submittedData'];
  reviewNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function mapKycProfile(kyc: Kyc): KycProfileView {
  return {
    id: kyc.id,
    userId: kyc.userId,
    status: kyc.status,
    submittedData: kyc.submittedData,
    reviewNote: kyc.reviewNote,
    reviewedAt: kyc.reviewedAt,
    createdAt: kyc.createdAt,
    updatedAt: kyc.updatedAt,
  };
}
