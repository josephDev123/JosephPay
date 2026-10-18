import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { WalletFundingService } from '../WalletFunding/wallet-funding.service.js';
import { PaystackWebhookAdapter } from './paystack-webhook.adapter.js';

@Injectable()
export class WebhookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adapter: PaystackWebhookAdapter,
    private readonly funding: WalletFundingService,
  ) {}

  async receive(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
    payload: any,
  ) {
    if (!this.adapter.canHandle(headers))
      throw new ConflictException('Unable to identify payment provider');

    if (!this.adapter.verify(rawBody, headers))
      throw new ConflictException('Invalid webhook signature');

    const normalized = this.adapter.normalize(payload);

    const event = await this.prisma.webhookEvent
      .create({
        data: {
          provider: normalized.provider,
          eventReference: normalized.eventReference,
          eventType: normalized.eventType,
          payload,
          signatureValid: true,
        },
      })
      .catch(() => null);

    if (!event) return { accepted: true, duplicate: true };

    if (
      normalized.providerReference &&
      normalized.eventType === 'charge.success'
    )
      await this.funding.completeFromProvider(
        normalized.provider,
        normalized.providerReference,
      );

    await this.prisma.webhookEvent.update({
      where: { id: event.id },
      data: { processingStatus: 'PROCESSED', processedAt: new Date() },
    });

    return { accepted: true, duplicate: false };
  }
}
