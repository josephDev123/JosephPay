import { Module } from '@nestjs/common';
import { WalletFundingModule } from '../WalletFunding/wallet-funding.module.js';
import { WebhookController } from './webhook.controller.js';
import { WebhookProviderFactory } from './webhook-provider.factory.js';
import { PaystackWebhookAdapter } from './paystack-webhook.adapter.js';
import { WebhookService } from './webhook.service.js';

@Module({
  imports: [WalletFundingModule],
  controllers: [WebhookController],
  providers: [WebhookService, WebhookProviderFactory, PaystackWebhookAdapter],
})
export class WebhookModule {}
