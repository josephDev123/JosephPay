import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, LedgerEntryType } from '../../lib/prisma/generated/client.js';

type LedgerPosting = {
  ledgerAccountId: string;
  entryType: LedgerEntryType;
  amount: bigint;
  currency: 'NGN' | 'USD';
};

@Injectable()
export class LedgerService {
  async postBalanced(
    database: Prisma.TransactionClient,
    transactionId: string,
    entries: LedgerPosting[],
  ) {
    if (entries.length < 2 || entries.some((entry) => entry.amount <= 0n)) {
      throw new BadRequestException(
        'A ledger transaction requires valid entries',
      );
    }

    const debits = entries
      .filter((entry) => entry.entryType === LedgerEntryType.DEBIT)
      .reduce((total, entry) => total + entry.amount, 0n);

    const credits = entries
      .filter((entry) => entry.entryType === LedgerEntryType.CREDIT)
      .reduce((total, entry) => total + entry.amount, 0n);

    if (debits !== credits) {
      throw new BadRequestException('Ledger transaction is not balanced');
    }

    const accounts = await database.ledgerAccount.findMany({
      where: { id: { in: entries.map((entry) => entry.ledgerAccountId) } },
      include: { walletBalance: true },
    });

    if (
      accounts.length !==
      new Set(entries.map((entry) => entry.ledgerAccountId)).size
    ) {
      throw new BadRequestException(
        'One or more ledger accounts were not found',
      );
    }

    for (const entry of entries) {
      const account = accounts.find(
        (candidate) => candidate.id === entry.ledgerAccountId,
      );
      if (!account || account.currency !== entry.currency) {
        throw new BadRequestException(
          'Ledger account currency does not match entry currency',
        );
      }

      await database.ledgerEntry.create({
        data: {
          transactionId,
          ledgerAccountId: entry.ledgerAccountId,
          entryType: entry.entryType,
          amount: entry.amount,
          currency: entry.currency,
        },
      });

      if (account.walletBalance) {
        const delta =
          entry.entryType === LedgerEntryType.CREDIT
            ? entry.amount
            : -entry.amount;
        const nextBalance = account.walletBalance.balance + delta;

        if (nextBalance < 0n) {
          throw new BadRequestException('Insufficient wallet balance');
        }

        await database.walletBalance.update({
          where: { id: account.walletBalance.id },
          data: { balance: nextBalance },
        });
      }
    }
  }
}
