import { Module } from '@nestjs/common';
import { LedgerModule } from '../Ledger/ledger.module.js';
import { WalletFundingController } from './wallet-funding.controller.js';
import { WalletFundingService } from './wallet-funding.service.js';
import { PaymentProviderFactory } from './providers/payment-provider.factory.js';
import { PaystackProvider } from './providers/paystack.provider.js';

@Module({
  imports: [LedgerModule],
  controllers: [WalletFundingController],
  providers: [WalletFundingService, PaymentProviderFactory, PaystackProvider],
  exports: [WalletFundingService],
})
export class WalletFundingModule {}
