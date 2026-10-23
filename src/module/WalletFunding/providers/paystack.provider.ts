import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { Currency } from '../../../lib/prisma/generated/client.js';
import type {
  InitializePaymentInput,
  PaymentProviderClient,
  ProviderInitializationResult,
  ProviderVerificationResult,
} from './payment-provider.js';

@Injectable()
export class PaystackProvider implements PaymentProviderClient {
  readonly name = 'PAYSTACK' as const;

  private readonly baseUrl = 'https://api.paystack.co';

  private headers() {
    const key = process.env.PAYSTACK_SECRET_KEY;
    if (!key)
      throw new ServiceUnavailableException(
        'Payment provider is not configured',
      );
    return {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    };
  }

  async initialize(
    input: InitializePaymentInput,
  ): Promise<ProviderInitializationResult> {
    const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        reference: input.reference,
        amount: input.amount.toString(),
        currency: input.currency,
        email: input.customerEmail,
      }),
    });
    const raw = (await response.json()) as {
      status?: boolean;
      data?: {
        reference?: string;
        authorization_url?: string;
        access_code?: string;
      };
    };
    if (!response.ok || !raw.status || !raw.data?.reference)
      throw new ServiceUnavailableException('Unable to initialize payment');
    return {
      providerReference: raw.data.reference,
      authorizationUrl: raw.data.authorization_url ?? null,
      accessCode: raw.data.access_code ?? null,
      rawResponse: raw,
    };
  }

  async verify(reference: string): Promise<ProviderVerificationResult> {
    const response = await fetch(
      `${this.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: this.headers() },
    );
    const raw = (await response.json()) as {
      status?: boolean;
      data?: {
        reference?: string;
        status?: string;
        amount?: number;
        currency?: Currency;
        paid_at?: string;
      };
    };
    const data = raw.data;
    if (
      !response.ok ||
      !raw.status ||
      !data?.reference ||
      !data.currency ||
      data.amount === undefined
    )
      throw new ServiceUnavailableException('Unable to verify payment');
    const statuses: Record<string, ProviderVerificationResult['status']> = {
      success: 'SUCCESS',
      failed: 'FAILED',
      reversed: 'REVERSED',
      pending: 'PENDING',
      processing: 'PENDING',
      ongoing: 'PENDING',
    };
    return {
      providerReference: data.reference,
      status: statuses[data.status ?? ''] ?? 'PENDING',
      amount: BigInt(data.amount),
      currency: data.currency,
      paidAt: data.paid_at ? new Date(data.paid_at) : null,
      rawResponse: raw,
    };
  }
}
