import { Injectable } from '@nestjs/common';
import {
  Currency,
  LedgerAccountOwnerType,
  LedgerAccountType,
} from '../../lib/prisma/generated/enums.js';
import type { Wallet, WalletBalance } from '../../lib/prisma/generated/client.js';
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

  async createWallets(userId: string, prisma: DatabaseClient = this.prisma) {
    const accountNumbers = new Map<SupportedCurrency, string>();

    for (const currency of SUPPORTED_CURRENCIES) {
      const [sequenceValue] = await prisma.$queryRaw<
        { accountNumber: string }[]
      >(Prisma.sql`
        SELECT nextval('ledger_account_number_seq')::text AS "accountNumber"
      `);

      if (!sequenceValue?.accountNumber) {
        throw new Error('Unable to generate ledger account number');
      }

      accountNumbers.set(currency, sequenceValue.accountNumber);
    }

    return prisma.wallet.create({
      data: {
        userId,
        balances: {
          create: SUPPORTED_CURRENCIES.map((currency) => ({
            currency: currency as Currency,
            balance: 0n,
            ledgerAccount: {
              create: {
                code: `CUSTOMER_WALLET_${userId}_${currency}`,
                accountNumber: accountNumbers.get(currency),
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
      include: { balances: { include: { ledgerAccount: true } } },
    }) as unknown as Promise<Wallet & { balances: WalletBalance[] }>;
  }

  async findWalletsByUserId(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: { balances: { include: { ledgerAccount: true } } },
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
