import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PaymentProvider } from '../../lib/prisma/generated/client.js';

export type NormalizedWebhook = {
  provider: PaymentProvider;
  eventReference: string;
  eventType: string;
  providerReference?: string;
};

export interface WebhookProviderAdapter {
  readonly provider: PaymentProvider;

  canHandle(headers: Record<string, string | string[] | undefined>): boolean;
  verify(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): boolean;
  normalize(payload: any): NormalizedWebhook;
}

export function header(
  headers: Record<string, string | string[] | undefined>,
  name: string,
) {
  const value = headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

export function verifyHmac(
  rawBody: Buffer,
  signature: string | undefined,
  secret: string | undefined,
  algorithm: 'sha512' | 'sha256',
) {
  if (!signature || !secret) return false;
  const expected = createHmac(algorithm, secret).update(rawBody).digest('hex');
  return (
    expected.length === signature.length &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  );
}
