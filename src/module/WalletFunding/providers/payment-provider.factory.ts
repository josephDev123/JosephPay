import { Injectable, NotImplementedException } from '@nestjs/common';
import type { PaymentProvider } from '../../../lib/prisma/generated/client.js';
import type { PaymentProviderClient } from './payment-provider.js';
import { PaystackProvider } from './paystack.provider.js';

@Injectable()
export class PaymentProviderFactory {
  constructor(private readonly paystack: PaystackProvider) {}
  get(provider: PaymentProvider): PaymentProviderClient {
    if (provider === 'PAYSTACK') return this.paystack;
    throw new NotImplementedException(
      `${provider} payment provider is not implemented yet`,
    );
  }
}
