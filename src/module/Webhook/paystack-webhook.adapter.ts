import { Injectable } from '@nestjs/common';
import type { PaymentProvider } from '../../lib/prisma/generated/client.js';
import {
  header,
  verifyHmac,
  type WebhookProviderAdapter,
} from './webhook-provider.js';

@Injectable()
export class PaystackWebhookAdapter implements WebhookProviderAdapter {
  readonly provider = 'PAYSTACK' as PaymentProvider;

  canHandle(headers: Record<string, string | string[] | undefined>) {
    return Boolean(header(headers, 'x-paystack-signature'));
  }

  verify(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ) {
    return verifyHmac(
      rawBody,
      header(headers, 'x-paystack-signature'),
      process.env.PAYSTACK_SECRET_KEY,
      'sha512',
    );
  }

  normalize(payload: any) {
    return {
      provider: this.provider,
      eventReference: `${payload.event ?? 'unknown'}:${payload.data?.reference ?? 'unknown'}`,
      eventType: payload.event ?? 'unknown',
      providerReference: payload.data?.reference,
    };
  }
}
