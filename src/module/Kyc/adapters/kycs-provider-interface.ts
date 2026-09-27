import { SubmitKycDto } from '../dto/submit-kyc.dto.js';
import { Kyc as KycType } from 'src/lib/prisma/generated/client.js';

export type KycIdentityType = Omit<
  KycType,
  | 'id'
  | 'updatedAt'
  | 'createdAt'
  | 'reviewedAt'
  | 'userId'
  | 'documentType'
  | 'status'
  | 'provider'
>;

export interface KycProvider {
  verifyKYCIdentity(
    data: Omit<SubmitKycDto, 'documentType'>,
  ): Promise<KycIdentityType>;
}
