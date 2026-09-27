import { Injectable } from '@nestjs/common';
import {
  Currency,
  LedgerAccountOwnerType,
  LedgerAccountType,
} from '../../lib/prisma/generated/enums.js';
import { PrismaService } from '../../lib/prisma/prisma.service.js';
import {
  SUPPORTED_CURRENCIES,
  SupportedCurrency,
} from '../../shared/constants/currencies.js';
import { Prisma } from '../../lib/prisma/generated/client.js';

type DatabaseClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class WalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  createWallets(userId: string, prisma: DatabaseClient = this.prisma) {
    return prisma.wallet.create({
      data: {
        userId,
        balances: {
          create: SUPPORTED_CURRENCIES.map((currency) => ({
            currency: currency as Currency,
            balance: 0n,
            ledgerAccount: {
              create: {
                name: `Customer wallet ${userId} ${currency}`,
                type: LedgerAccountType.CUSTOMER_WALLET,
                ownerType: LedgerAccountOwnerType.CUSTOMER,
                ownerId: userId,
                currency: currency as Currency,
              },
            },
          })),
        },
      },
      include: { balances: true },
    });
  }

  async findWalletsByUserId(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: { balances: true },
    });

    return wallet?.balances ?? [];
  }

  async upsertWalletBalance(
    userId: string,
    currency: SupportedCurrency,
    balance: bigint,
  ) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new Error(`Wallet not found for user ${userId}`);
    }

    return this.prisma.walletBalance.update({
      where: {
        walletId_currency: {
          walletId: wallet.id,
          currency: currency as Currency,
        },
      },
      data: { balance },
    });
  }
}
