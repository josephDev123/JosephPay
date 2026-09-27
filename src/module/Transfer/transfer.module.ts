import { Module } from '@nestjs/common';
import { LedgerModule } from '../Ledger/ledger.module.js';
import { TransactionModule } from '../Transaction/transaction.module.js';
import { WalletModule } from '../Wallet/wallet.module.js';
import { TransferController } from './transfer.controller.js';
import { TransferService } from './transfer.service.js';

@Module({
  imports: [WalletModule, LedgerModule, TransactionModule],
  controllers: [TransferController],
  providers: [TransferService],
})
export class TransferModule {}
