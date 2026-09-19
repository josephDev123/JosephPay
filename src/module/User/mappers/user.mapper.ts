import type {
  Kyc,
  User,
  Wallet,
} from '../../../lib/prisma/generated/client.js';
import type { SupportedCurrency } from '../../../shared/constants/currencies.js';
import {
  mapProfile,
  type ProfileRecord,
  type ProfileView,
} from '../../Profile/mappers/profile.mapper.js';

export interface WalletView {
  id: string;
  currency: SupportedCurrency;
  balance: string;
  createdAt: Date;
  updatedAt: Date;
}

// export interface KycView {
//   id: string;
//   userId: string;
//   status: Kyc['status'];
//   submittedData: Kyc['submittedData'];
//   reviewNote: string | null;
//   reviewedAt: Date | null;
//   createdAt: Date;
//   updatedAt: Date;
// }

export interface KycView {
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

export interface UserView {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfileView extends UserView {
  wallets: WalletView[];
  kyc: KycView | null;
  profile: ProfileView | null;
}

export function mapWallet(wallet: Wallet): WalletView {
  return {
    id: wallet.id,
    currency: wallet.currency as SupportedCurrency,
    balance: wallet.balance.toString(),
    createdAt: wallet.createdAt,
    updatedAt: wallet.updatedAt,
  };
}

export function mapKyc(kyc: Kyc | null): KycView | null {
  if (!kyc) {
    return null;
  }

  return {
    id: kyc.id,
    userId: kyc.userId,
    status: kyc.status,
    // submittedData: kyc.submittedData,
    documentType: kyc.documentType,
    reviewNote: kyc.reviewNote,
    reviewedAt: kyc.reviewedAt,
    createdAt: kyc.createdAt,
    updatedAt: kyc.updatedAt,
    firstName: kyc.firstName,
    lastName: kyc.lastName,
    dateOfBirth: kyc.dateOfBirth,
    documentExpiryDate: kyc.documentExpiryDate,
    documentIssueDate: kyc.documentIssueDate,
    documentNumber: kyc.documentNumber,
    middleName: kyc.middleName,
    nationality: kyc.nationality,
    provider: kyc.provider,
    providerReference: kyc.providerReference,
  };
}

export type UserRecord = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type UserWithRelations = UserRecord & {
  wallets: Wallet[];
  kyc: Kyc | null;
  profile?: ProfileRecord | null;
};

export function mapUserProfile(user: UserWithRelations): UserProfileView {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    middleName: user.middleName,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    wallets: user.wallets.map(mapWallet),
    kyc: mapKyc(user.kyc),
    profile: mapProfile(user.profile ?? null),
  };
}
