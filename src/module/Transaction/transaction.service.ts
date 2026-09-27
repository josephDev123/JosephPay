import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TransactionStatus } from '../../lib/prisma/generated/client.js';
import { PrismaService } from '../../lib/prisma/prisma.service.js';

export function serializeTransaction<T extends {
  amount: bigint;
  ledgerEntries: Array<{ amount: bigint }>;
}>(transaction: T) {
  return {
    ...transaction,
    amount: transaction.amount.toString(),
    ledgerEntries: transaction.ledgerEntries.map((entry) => ({
      ...entry,
      amount: entry.amount.toString(),
    })),
  };
}

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  create(
    database: Prisma.TransactionClient,
    input: {
      reference: string;
      type: 'TRANSFER';
      amount: bigint;
      currency: 'NGN' | 'USD';
      initiatedByUserId: string;
      sourceAccountId: string;
      destinationAccountId: string;
      idempotencyScope: string;
      idempotencyKey: string;
    },
  ) {
    return database.transaction.create({
      data: {
        ...input,
        status: TransactionStatus.PROCESSING,
      },
      include: { ledgerEntries: true },
    });
  }

  async findForUser(userId: string, transactionId?: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        initiatedByUserId: userId,
        ...(transactionId ? { id: transactionId } : {}),
      },
      include: { ledgerEntries: true },
      orderBy: { createdAt: 'desc' },
    });

    if (transactionId && !transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction ? serializeTransaction(transaction) : transaction;
  }

  async listForUser(userId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: { initiatedByUserId: userId },
      include: { ledgerEntries: true },
      orderBy: { createdAt: 'desc' },
    });

    return transactions.map(serializeTransaction);
  }
}
