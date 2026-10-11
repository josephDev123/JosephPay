import { Module } from '@nestjs/common';
import { LedgerModule } from '../Ledger/ledger.module.js';
import { CollectionController } from './collection.controller.js';
import { CollectionService } from './collection.service.js';
import { PaystackProvider } from './providers/paystack.provider.js';
import { PaymentProviderFactory } from './providers/payment-provider.factory.js';

@Module({
  imports: [LedgerModule],
  controllers: [CollectionController],
  providers: [CollectionService, PaystackProvider, PaymentProviderFactory],
})
export class CollectionModule {}
