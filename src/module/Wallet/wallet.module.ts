import { Module } from '@nestjs/common';
import { WalletRepository } from './walletRepository.js';
import { WalletController } from './walletController.js';
import { WalletService } from './walletService.js';

@Module({
  controllers: [WalletController],
  providers: [WalletService, WalletRepository],
  exports: [WalletRepository],
})
export class WalletModule {}
