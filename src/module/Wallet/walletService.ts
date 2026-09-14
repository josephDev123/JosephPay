import { Injectable } from '@nestjs/common';
import { WalletRepository } from './walletRepository.js';
import { CreateWalletDto } from './validation/create-wallet.validation.js';

// type DatabaseClient = PrismaService | PrismaClient | Prisma.TransactionClient;

@Injectable()
export class WalletService {
  constructor(private readonly walletRepository: WalletRepository) {}

  async createWallet(data: CreateWalletDto) {
    return this.walletRepository.createWallets(data.userId);
  }
}
