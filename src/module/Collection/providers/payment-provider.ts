import type { Currency, PaymentProvider } from '../../../lib/prisma/generated/client.js';

export type InitializePaymentInput = {
  reference: string;
  amount: bigint;
  currency: Currency;
  customerEmail: string;
  customerName?: string;
};

export type ProviderInitializationResult = {
  providerReference: string;
  authorizationUrl: string | null;
  accessCode: string | null;
  rawResponse: unknown;
};

export type ProviderVerificationResult = {
  providerReference: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED';
  amount: bigint;
  currency: Currency;
  paidAt: Date | null;
  rawResponse: unknown;
};

export interface PaymentProviderClient {
  readonly name: PaymentProvider;
  initialize(input: InitializePaymentInput): Promise<ProviderInitializationResult>;
  verify(reference: string): Promise<ProviderVerificationResult>;
  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean;
}
