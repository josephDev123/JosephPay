import { Module } from '@nestjs/common';
import { LedgerAccountController } from './ledger-account.controller.js';
import { LedgerAccountService } from './ledger-account.service.js';

@Module({
  controllers: [LedgerAccountController],
  providers: [LedgerAccountService],
})
export class LedgerAccountModule {}
