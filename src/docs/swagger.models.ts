import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KycStatus } from '../lib/prisma/generated/enums.js';
import { SUPPORTED_CURRENCIES } from '../shared/constants/currencies.js';

const PROFILE_GENDERS = [
  'MALE',
  'FEMALE',
  'OTHER',
  'PREFER_NOT_TO_SAY',
] as const;

export class ProfileDto {
  @ApiProperty({
    example: 'c2d1f7f5-7f87-45ed-86d1-4f3f6a5c4e01',
  })
  id!: string;

  @ApiProperty({
    example: '4b0ebf08-1c4c-4a7d-8b0a-9f4d42c1f4bc',
  })
  userId!: string;

  @ApiPropertyOptional({
    example: '+2348012345678',
    nullable: true,
  })
  phoneNumber!: string | null;

  @ApiPropertyOptional({
    example: '2026-08-06T11:15:00.000Z',
    format: 'date-time',
    nullable: true,
  })
  phoneVerifiedAt!: string | null;

  @ApiPropertyOptional({
    example: '1994-05-20',
    format: 'date',
    nullable: true,
  })
  dateOfBirth!: string | null;

  @ApiPropertyOptional({
    enum: PROFILE_GENDERS,
    example: 'PREFER_NOT_TO_SAY',
    nullable: true,
  })
  gender!: (typeof PROFILE_GENDERS)[number] | null;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/avatars/user-123.png',
    nullable: true,
  })
  avatarUrl!: string | null;

  @ApiPropertyOptional({
    example: '14 Admiralty Way',
    nullable: true,
  })
  addressLine1!: string | null;

  @ApiPropertyOptional({
    example: 'Lekki Phase 1',
    nullable: true,
  })
  addressLine2!: string | null;

  @ApiPropertyOptional({
    example: 'Lagos',
    nullable: true,
  })
  city!: string | null;

  @ApiPropertyOptional({
    example: 'Lagos',
    nullable: true,
  })
  state!: string | null;

  @ApiPropertyOptional({
    example: 'NG',
    nullable: true,
  })
  country!: string | null;

  @ApiPropertyOptional({
    example: '100001',
    nullable: true,
  })
  postalCode!: string | null;

  @ApiProperty({
    example: '2026-08-06T11:00:00.000Z',
    format: 'date-time',
  })
  createdAt!: string;

  @ApiProperty({
    example: '2026-08-06T11:00:00.000Z',
    format: 'date-time',
  })
  updatedAt!: string;
}

export class UserProfileDto {
  @ApiProperty({
    example: '4b0ebf08-1c4c-4a7d-8b0a-9f4d42c1f4bc',
  })
  id!: string;

  @ApiProperty({
    example: 'jane.doe@example.com',
  })
  email!: string;

  @ApiProperty({
    example: 'Jane',
  })
  firstName!: string;

  @ApiProperty({
    example: 'Doe',
  })
  lastName!: string;

  @ApiProperty({
    example: 'Mary',
  })
  middleName!: string;

  @ApiPropertyOptional({
    example: '2026-08-06T11:00:00.000Z',
    format: 'date-time',
    nullable: true,
  })
  emailVerifiedAt!: string | null;

  @ApiProperty({
    example: '2026-08-06T11:00:00.000Z',
    format: 'date-time',
  })
  createdAt!: string;

  @ApiProperty({
    example: '2026-08-06T11:00:00.000Z',
    format: 'date-time',
  })
  updatedAt!: string;

  @ApiProperty({
    type: () => ProfileDto,
    nullable: true,
  })
  profile!: ProfileDto | null;

  @ApiProperty({
    type: () => [WalletDto],
  })
  wallets!: WalletDto[];

  @ApiProperty({
    type: () => KycDto,
    nullable: true,
  })
  kyc!: KycDto | null;
}
export class AuthLoginResponseDto {
  @ApiProperty({
    example: true,
  })
  success!: true;

  @ApiProperty({
    example: 'Login successful',
  })
  message!: string;

  @ApiProperty({
    type: () => UserProfileDto,
  })
  data!: UserProfileDto;
}

export class ProfileResponseDto {
  @ApiProperty({
    example: true,
  })
  success!: true;

  @ApiProperty({
    example: 'User profile fetched successfully',
  })
  message!: string;

  @ApiProperty({
    type: () => ProfileDto,
  })
  data!: ProfileDto;
}

export class AuthLoginRequestDto {
  @ApiProperty({
    example: 'jane.doe@example.com',
  })
  email!: string;

  @ApiProperty({
    example: 'StrongPassword123!',
    minLength: 8,
  })
  password!: string;
}

export class CreateUserRequestDto {
  @ApiProperty({
    example: 'jane.doe@example.com',
  })
  email!: string;

  @ApiProperty({
    example: 'Jane Doe',
  })
  firstName!: string;

  @ApiProperty({
    example: 'Doe',
  })
  lastName!: string;

  @ApiProperty({
    example: 'Doe',
  })
  middleName!: string;

  @ApiProperty({
    example: 'StrongPassword123!',
    minLength: 8,
  })
  password!: string;
}

export class VerifyEmailRequestDto {
  @ApiProperty({
    example: 'jane.doe@example.com',
  })
  email!: string;

  @ApiProperty({
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  otp!: string;
}

export class ResendVerificationRequestDto {
  @ApiProperty({
    example: 'jane.doe@example.com',
  })
  email!: string;
}

export class VerificationEmailResponseDto {
  @ApiProperty({
    example: true,
  })
  success!: true;

  @ApiProperty({
    example: 'Verification email sent successfully',
  })
  message!: string;

  @ApiProperty({
    type: Object,
    example: {
      email: 'jane.doe@example.com',
    },
  })
  data!: {
    email: string;
  };
}

export class WalletDto {
  @ApiProperty({
    example: 'b3f22c43-6f8d-4b7f-b3a9-6de7b3a2b6c1',
  })
  id!: string;

  @ApiProperty({
    enum: SUPPORTED_CURRENCIES,
    example: 'NGN',
  })
  currency!: (typeof SUPPORTED_CURRENCIES)[number];

  @ApiProperty({
    example: '0',
    description: 'Wallet balance in the smallest currency unit.',
  })
  balance!: string;

  @ApiProperty({
    example: '2026-08-06T11:00:00.000Z',
    format: 'date-time',
  })
  createdAt!: string;

  @ApiProperty({
    example: '2026-08-06T11:00:00.000Z',
    format: 'date-time',
  })
  updatedAt!: string;
}

export class KycDto {
  @ApiProperty({
    example: '8f9db6fd-1d87-4d8c-9ccf-9f16a8d8be8d',
  })
  id!: string;

  @ApiProperty({
    example: '7d4ef0d2-0b37-4b1d-a9fd-81d1d4ce9c4f',
  })
  userId!: string;

  @ApiProperty({
    enum: Object.values(KycStatus),
    example: 'PENDING',
  })
  status!: keyof typeof KycStatus;

  @ApiProperty({
    enum: [
      'NIN',
      'PASSPORT',
      'BVN',
      'DRIVERS_LICENSE',
      'VOTERS_CARD',
      'NATIONAL_ID_CARD',
    ],
    example: 'BVN',
  })
  documentType!: string;

  @ApiPropertyOptional({
    example: 'Verified by compliance team',
    nullable: true,
  })
  reviewNote!: string | null;

  @ApiPropertyOptional({
    example: '2026-08-06T11:15:00.000Z',
    format: 'date-time',
    nullable: true,
  })
  reviewedAt!: string | null;

  @ApiProperty({
    example: '2026-08-06T11:00:00.000Z',
    format: 'date-time',
  })
  createdAt!: string;

  @ApiProperty({
    example: '2026-08-06T11:00:00.000Z',
    format: 'date-time',
  })
  updatedAt!: string;
}

export class UserProfileResponseDto {
  @ApiProperty({
    example: true,
  })
  success!: true;

  @ApiProperty({
    example: 'User profile fetched successfully',
  })
  message!: string;

  @ApiProperty({
    type: () => UserProfileDto,
  })
  data!: UserProfileDto;
}

export class CreateWalletRequestDto {
  @ApiProperty({
    example: '4b0ebf08-1c4c-4a7d-8b0a-9f4d42c1f4bc',
  })
  userId!: string;
}

export class WalletListResponseDto {
  @ApiProperty({
    example: true,
  })
  success!: true;

  @ApiProperty({
    example: 'Wallet created successfully',
  })
  message!: string;

  @ApiProperty({
    type: () => [WalletDto],
  })
  data!: WalletDto[];
}

export class ReviewKycRequestDto {
  @ApiProperty({
    enum: ['VERIFIED', 'FAILED'],
    example: 'VERIFIED',
  })
  status!: 'VERIFIED' | 'FAILED';

  @ApiPropertyOptional({
    example: 'All submitted documents are valid.',
    minLength: 2,
    maxLength: 500,
  })
  reviewNote?: string;
}

export class SubmitKycRequestDto {
  @ApiProperty({
    description: 'The identity value to verify with the KYC provider.',
    example: '12345678901',
  })
  value!: string;

  @ApiProperty({
    enum: [
      'NIN',
      'PASSPORT',
      'BVN',
      'DRIVERS_LICENSE',
      'VOTERS_CARD',
      'NATIONAL_ID_CARD',
    ],
    example: 'BVN',
  })
  documentType!: string;
}

export class KycResponseDto {
  @ApiProperty({
    example: true,
  })
  success!: true;

  @ApiProperty({
    example: 'KYC submitted successfully',
  })
  message!: string;

  @ApiProperty({
    type: () => KycDto,
  })
  data!: KycDto;
}

export class LedgerEntryResponseDto {
  @ApiProperty({ example: '4c8e5f7e-5ac8-4f39-a2af-2d5c5b9df5d1' })
  id!: string;

  @ApiProperty({ example: 'DEBIT', enum: ['DEBIT', 'CREDIT'] })
  entryType!: 'DEBIT' | 'CREDIT';

  @ApiProperty({ example: '2000000', description: 'Amount in minor currency units.' })
  amount!: string;

  @ApiProperty({ example: 'NGN', enum: ['NGN', 'USD'] })
  currency!: 'NGN' | 'USD';

  @ApiProperty({ example: '2026-09-27T10:00:00.000Z', format: 'date-time' })
  createdAt!: string;
}

export class TransactionDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-4789-9012-345678901234' })
  id!: string;

  @ApiProperty({ example: 'TRF-20260927-8F92K' })
  reference!: string;

  @ApiProperty({ example: 'TRANSFER', enum: ['TRANSFER', 'DEPOSIT', 'WITHDRAWAL', 'PAYMENT', 'REFUND', 'FEE', 'REVERSAL'] })
  type!: string;

  @ApiProperty({ example: 'SUCCESS', enum: ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REVERSED', 'CANCELLED'] })
  status!: string;

  @ApiProperty({ example: '2000000', description: 'Amount in minor currency units.' })
  amount!: string;

  @ApiProperty({ example: 'NGN', enum: ['NGN', 'USD'] })
  currency!: 'NGN' | 'USD';

  @ApiPropertyOptional({ example: '4c8e5f7e-5ac8-4f39-a2af-2d5c5b9df5d1', nullable: true })
  sourceAccountId!: string | null;

  @ApiPropertyOptional({ example: '9d8c7b6a-5f4e-4321-9012-345678901234', nullable: true })
  destinationAccountId!: string | null;

  @ApiProperty({ type: () => [LedgerEntryResponseDto] })
  ledgerEntries!: LedgerEntryResponseDto[];

  @ApiProperty({ example: '2026-09-27T10:00:00.000Z', format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ example: '2026-09-27T10:00:00.000Z', format: 'date-time' })
  updatedAt!: string;
}

export class TransactionResponseDto {
  @ApiProperty({ example: true })
  success!: true;

  @ApiProperty({ example: 'Transaction fetched successfully' })
  message!: string;

  @ApiProperty({ type: () => TransactionDto })
  data!: TransactionDto;
}

export class TransactionListResponseDto {
  @ApiProperty({ example: true })
  success!: true;

  @ApiProperty({ example: 'Transactions fetched successfully' })
  message!: string;

  @ApiProperty({ type: () => [TransactionDto] })
  data!: TransactionDto[];
}

export class TransferRequestDto {
  @ApiProperty({ example: '9d8c7b6a-5f4e-4321-9012-345678901234', format: 'uuid' })
  destinationUserId!: string;

  @ApiProperty({ example: 'NGN', enum: ['NGN', 'USD'] })
  currency!: 'NGN' | 'USD';

  @ApiProperty({ example: '2000000', description: 'Amount in minor currency units.' })
  amount!: string;

  @ApiProperty({ example: 'transfer-request-123', minLength: 8, maxLength: 128 })
  idempotencyKey!: string;
}

export class TransferResponseDto extends TransactionResponseDto {
}
