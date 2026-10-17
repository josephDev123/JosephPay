import { BadRequestException, Injectable } from '@nestjs/common';
import type { WebhookProviderAdapter } from './webhook-provider.js';
import { PaystackWebhookAdapter } from './paystack-webhook.adapter.js';

@Injectable()
export class WebhookProviderFactory {
  constructor(private readonly paystack: PaystackWebhookAdapter) {}

  resolve(
    headers: Record<string, string | string[] | undefined>,
  ): WebhookProviderAdapter {
    const matches = [this.paystack].filter((adapter) =>
      adapter.canHandle(headers),
    );
    if (matches.length !== 1)
      throw new BadRequestException('Unable to identify payment provider');
    return matches[0];
  }
}
