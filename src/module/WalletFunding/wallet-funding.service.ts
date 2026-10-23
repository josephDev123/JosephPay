import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  LedgerAccountOwnerType,
  LedgerAccountType,
  LedgerEntryType,
  PaymentProvider,
  Prisma,
  TransactionStatus,
  TransactionType,
} from '../../lib/prisma/generated/client.js';
import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { LedgerService } from '../Ledger/ledger.service.js';
import { PaymentProviderFactory } from './providers/payment-provider.factory.js';
import { createFundingDTO } from './dto/createFundingDTO.js';

@Injectable()
export class WalletFundingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly providers: PaymentProviderFactory,
  ) {}

  async initiate(input: createFundingDTO & { userId: string }) {
    if (input.amount <= 0n)
      throw new ConflictException('Amount must be greater than zero');
    const scope = `WALLET_FUNDING:${input.userId}`;
    const reference = `DEP-${crypto.randomUUID().replaceAll('-', '').slice(0, 24).toUpperCase()}`;
    const transaction = await this.prisma.$transaction(async (db) => {
      const existing = await db.transaction.findUnique({
        where: {
          idempotencyScope_idempotencyKey: {
            idempotencyScope: scope,
            idempotencyKey: input.idempotencyKey,
          },
        },
      });
      if (existing) return existing;
      const transaction = await db.transaction.create({
        data: {
          reference,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.PROCESSING,
          amount: input.amount,
          currency: input.currency,
          description: 'Wallet funding',
          initiatedByUserId: input.userId,
          idempotencyScope: scope,
          idempotencyKey: input.idempotencyKey,
        },
      });
      return transaction;
    });
    if (transaction.providerReference) return transaction;
    try {
      const result = await this.providers.get(input.provider).initialize({
        reference: transaction.reference,
        amount: transaction.amount,
        currency: transaction.currency,
        customerEmail: input.customerEmail,
        customerName: input.customerName,
      });
      return this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          provider: input.provider,
          providerReference: result.providerReference,
          paymentUrl: result.authorizationUrl,
          providerResponse: result.rawResponse as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.FAILED,
          failureMessage:
            error instanceof Error
              ? error.message
              : 'Payment initialization failed',
        },
      });
      throw error;
    }
  }

  async completeFromProvider(
    provider: PaymentProvider,
    providerReference: string,
  ) {
    console.log('start update, verify of  the transaction');
    const transaction = await this.prisma.transaction.findFirst({
      where: { provider, providerReference },
    });

    if (!transaction)
      throw new NotFoundException('Wallet funding transaction not found');

    console.log('verifying  the transaction');
    const verified = await this.providers
      .get(provider)
      .verify(providerReference);

    if (verified.status !== 'SUCCESS')
      return { accepted: true, status: verified.status };

    if (
      verified.amount !== transaction.amount ||
      verified.currency !== transaction.currency
    )
      throw new ConflictException(
        'Provider payment does not match wallet funding',
      );

    await this.prisma.$transaction(async (db) => {
      await db.$queryRaw(
        Prisma.sql`SELECT id FROM transactions WHERE id = ${transaction.id} FOR UPDATE`,
      );
      const locked = await db.transaction.findUnique({
        where: { id: transaction.id },
      });

      if (!locked || locked.status === TransactionStatus.SUCCESS) return;

      console.log('deriving source and destination');

      const source = await db.ledgerAccount.findUnique({
        where: { code: `PAYSTACK_CLEARING_${locked.currency}` },
      });

      const destination = await db.walletBalance.findFirst({
        where: {
          wallet: { userId: locked.initiatedByUserId! },
          currency: locked.currency,
        },
        include: { ledgerAccount: true },
      });

      if (
        !source ||
        source.ownerType !== LedgerAccountOwnerType.SYSTEM ||
        source.type !== LedgerAccountType.BANK ||
        source.currency !== locked.currency ||
        source.status !== 'ACTIVE' ||
        !destination
      )
        throw new NotFoundException(
          'Wallet funding ledger accounts are not configured',
        );

      console.log('destination and source account', source, destination);

      console.log('start balance update  the ');
      await this.ledger.postBalanced(db, locked.id, [
        {
          ledgerAccountId: source.id,
          entryType: LedgerEntryType.DEBIT,
          amount: locked.amount,
          currency: locked.currency,
        },
        {
          ledgerAccountId: destination.ledgerAccountId,
          entryType: LedgerEntryType.CREDIT,
          amount: locked.amount,
          currency: locked.currency,
        },
      ]);

      console.log('end balance update  the ');

      await db.transaction.update({
        where: { id: locked.id },
        data: {
          status: TransactionStatus.SUCCESS,
          paidAt: verified.paidAt ?? new Date(),
          providerResponse: verified.rawResponse as Prisma.InputJsonValue,
          sourceAccountId: source.id,
          destinationAccountId: destination.ledgerAccountId,
        },
      });
    });

    return { accepted: true, status: 'SUCCESS' };
  }
}
