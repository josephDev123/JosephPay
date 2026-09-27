import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { LedgerEntryType, Prisma, TransactionStatus } from '../../lib/prisma/generated/client.js';
import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { LedgerService } from '../Ledger/ledger.service.js';
import { TransactionService } from '../Transaction/transaction.service.js';

@Injectable()
export class TransferService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
    private readonly transactionService: TransactionService,
  ) {}

  async transfer(input: {
    fromUserId: string;
    toUserId: string;
    currency: 'NGN' | 'USD';
    amount: bigint;
    idempotencyKey: string;
  }) {
    if (input.amount <= 0n || input.fromUserId === input.toUserId) {
      throw new ConflictException('Invalid transfer request');
    }

    return this.prisma.$transaction(async (database) => {
      const existing = await database.transaction.findUnique({
        where: {
          idempotencyScope_idempotencyKey: {
            idempotencyScope: `TRANSFER:${input.fromUserId}`,
            idempotencyKey: input.idempotencyKey,
          },
        },
        include: { ledgerEntries: true },
      });

      if (existing) return existing;

      const wallets = await database.wallet.findMany({
        where: { userId: { in: [input.fromUserId, input.toUserId] } },
        include: { balances: { where: { currency: input.currency }, include: { ledgerAccount: true } } },
      });
      const sender = wallets.find((wallet) => wallet.userId === input.fromUserId);
      const recipient = wallets.find((wallet) => wallet.userId === input.toUserId);
      const senderBalance = sender?.balances[0];
      const recipientBalance = recipient?.balances[0];

      if (!senderBalance || !recipientBalance) {
        throw new NotFoundException('Required wallet currency balance was not found');
      }

      const balanceIds = [senderBalance.id, recipientBalance.id].sort();
      await database.$queryRaw(
        Prisma.sql`SELECT id FROM wallet_balances WHERE id IN (${Prisma.join(
          balanceIds.map((id) => Prisma.sql`${id}::uuid`),
        )}) ORDER BY id FOR UPDATE`,
      );

      const lockedBalances = await database.walletBalance.findMany({
        where: { id: { in: balanceIds } },
      });
      const lockedSenderBalance = lockedBalances.find((balance) => balance.id === senderBalance.id);
      const lockedRecipientBalance = lockedBalances.find((balance) => balance.id === recipientBalance.id);

      if (!lockedSenderBalance || !lockedRecipientBalance) {
        throw new NotFoundException('Required wallet currency balance was not found');
      }
      if (lockedSenderBalance.balance < input.amount) {
        throw new ConflictException('Insufficient wallet balance');
      }

      const transaction = await this.transactionService.create(database, {
        reference: `TRF-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        type: 'TRANSFER',
        amount: input.amount,
        currency: input.currency,
        initiatedByUserId: input.fromUserId,
        sourceAccountId: lockedSenderBalance.ledgerAccountId,
        destinationAccountId: lockedRecipientBalance.ledgerAccountId,
        idempotencyScope: `TRANSFER:${input.fromUserId}`,
        idempotencyKey: input.idempotencyKey,
      });

      await this.ledgerService.postBalanced(database, transaction.id, [
        {
          ledgerAccountId: lockedSenderBalance.ledgerAccountId,
          entryType: LedgerEntryType.DEBIT,
          amount: input.amount,
          currency: input.currency,
        },
        {
          ledgerAccountId: lockedRecipientBalance.ledgerAccountId,
          entryType: LedgerEntryType.CREDIT,
          amount: input.amount,
          currency: input.currency,
        },
      ]);

      return database.transaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.SUCCESS },
        include: { ledgerEntries: true },
      });
    });
  }
}
