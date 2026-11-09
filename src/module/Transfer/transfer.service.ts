import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  LedgerEntryType,
  Prisma,
  TransactionStatus,
} from '../../lib/prisma/generated/client.js';
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
    recipientAccountNumber: string;
    currency: 'NGN' | 'USD';
    amount: bigint;
    description?: string;
    idempotencyKey: string;
  }) {
    // Prevent negative or zero amount transfers.
    if (input.amount <= 0n) {
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
        where: { userId: input.fromUserId },
        include: {
          balances: {
            where: { currency: input.currency },
            include: { ledgerAccount: true },
          },
        },
      });
      const sender = wallets.find(
        (wallet) => wallet.userId === input.fromUserId,
      );
      const senderBalance = sender?.balances[0];

      const recipientAccount = await database.ledgerAccount.findUnique({
        where: { accountNumber: input.recipientAccountNumber },
        include: { walletBalance: true },
      });

      const recipientBalance =
        recipientAccount?.type === 'CUSTOMER_WALLET' &&
        recipientAccount.ownerType === 'CUSTOMER' &&
        recipientAccount.status === 'ACTIVE' &&
        recipientAccount.currency === input.currency
          ? recipientAccount.walletBalance
          : null;

      if (!senderBalance || !recipientBalance) {
        throw new NotFoundException(
          'Required wallet currency balance was not found',
        );
      }

      if (
        recipientAccount?.ownerId === input.fromUserId ||
        recipientBalance.id === senderBalance.id
      ) {
        throw new ConflictException('Cannot transfer to your own account');
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
      const lockedSenderBalance = lockedBalances.find(
        (balance) => balance.id === senderBalance.id,
      );
      const lockedRecipientBalance = lockedBalances.find(
        (balance) => balance.id === recipientBalance.id,
      );

      if (!lockedSenderBalance || !lockedRecipientBalance) {
        throw new NotFoundException(
          'Required wallet currency balance was not found',
        );
      }
      if (lockedSenderBalance.balance < input.amount) {
        throw new ConflictException('Insufficient wallet balance');
      }

      const transaction = await this.transactionService.create(database, {
        reference: `TRF-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        type: 'TRANSFER',
        amount: input.amount,
        currency: input.currency,
        description:
          input.description ??
          `Transfer to account ${input.recipientAccountNumber}`,
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
