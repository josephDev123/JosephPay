import { Injectable } from '@nestjs/common';
import { Currency } from '../../lib/prisma/generated/enums.js';
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
    return Promise.all(
      SUPPORTED_CURRENCIES.map((currency) =>
        prisma.wallet.create({
          data: {
            userId,
            currency: currency as Currency,
            balance: 0n,
          },
        }),
      ),
    );
  }

  findWalletsByUserId(userId: string) {
    return this.prisma.wallet.findMany({
      where: {
        userId,
      },
      orderBy: {
        currency: 'asc',
      },
    });
  }

  upsertWalletBalance(
    userId: string,
    currency: SupportedCurrency,
    balance: bigint,
  ) {
    return this.prisma.wallet.upsert({
      where: {
        userId_currency: {
          userId,
          currency: currency as Currency,
        },
      },
      create: {
        userId,
        currency: currency as Currency,
        balance,
      },
      update: {
        balance,
      },
    });
  }
}
