import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CollectionStatus,
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

@Injectable()
export class CollectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly providers: PaymentProviderFactory,
  ) {}

  async create(input: {
    merchantUserId: string;
    amount: bigint;
    currency: 'NGN' | 'USD';
    customerEmail: string;
    customerName?: string;
    provider: PaymentProvider;
    idempotencyKey: string;
  }) {
    if (input.amount <= 0n)
      throw new ConflictException('Amount must be greater than zero');
    const scope = `COLLECTION:${input.merchantUserId}`;
    const reference = `COL-${crypto.randomUUID().replaceAll('-', '').slice(0, 24).toUpperCase()}`;
    const collection = await this.prisma.$transaction(async (db) => {
      const existing = await db.collection.findUnique({
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
          type: TransactionType.COLLECTION,
          status: TransactionStatus.PROCESSING,
          amount: input.amount,
          currency: input.currency,
          initiatedByUserId: input.merchantUserId,
          idempotencyScope: scope,
          idempotencyKey: input.idempotencyKey,
        },
      });
      return db.collection.create({
        data: {
          reference,
          merchantUserId: input.merchantUserId,
          transactionId: transaction.id,
          amount: input.amount,
          currency: input.currency,
          provider: input.provider,
          customerEmail: input.customerEmail,
          customerName: input.customerName,
          idempotencyScope: scope,
          idempotencyKey: input.idempotencyKey,
        },
      });
    });
    if (collection.providerReference) return collection;
    try {
      const result = await this.providers
        .get(input.provider)
        .initialize({
          reference: collection.reference,
          amount: collection.amount,
          currency: collection.currency,
          customerEmail: collection.customerEmail,
          customerName: collection.customerName ?? undefined,
        });
      return this.prisma.collection.update({
        where: { id: collection.id },
        data: {
          providerReference: result.providerReference,
          paymentUrl: result.authorizationUrl,
          providerResponse: result.rawResponse as Prisma.InputJsonValue,
          status: CollectionStatus.PROCESSING,
        },
      });
    } catch (error) {
      await this.prisma.collection.update({
        where: { id: collection.id },
        data: {
          status: CollectionStatus.FAILED,
          failureMessage:
            error instanceof Error
              ? error.message
              : 'Payment initialization failed',
        },
      });
      throw error;
    }
  }

  async processPaystackWebhook(
    rawBody: Buffer,
    signature: string,
    payload: { event?: string; data?: { reference?: string } },
  ) {
    const provider = this.providers.get(PaymentProvider.PAYSTACK);
    if (!provider.verifyWebhookSignature(rawBody, signature))
      throw new ConflictException('Invalid webhook signature');
    const eventReference = `${payload.event ?? 'unknown'}:${payload.data?.reference ?? crypto.randomUUID()}`;
    const event = await this.prisma.webhookEvent
      .create({
        data: {
          provider: PaymentProvider.PAYSTACK,
          eventReference,
          eventType: payload.event ?? 'unknown',
          payload,
          signatureValid: true,
        },
      })
      .catch(() => null);
    if (!event) return { accepted: true, duplicate: true };
    if (payload.event !== 'charge.success' || !payload.data?.reference)
      return { accepted: true, duplicate: false };
    const collection = await this.prisma.collection.findFirst({
      where: {
        provider: PaymentProvider.PAYSTACK,
        providerReference: payload.data.reference,
      },
      include: { transaction: true },
    });
    if (!collection) throw new NotFoundException('Collection not found');
    const verified = await provider.verify(payload.data.reference);
    if (verified.status !== 'SUCCESS')
      return { accepted: true, status: verified.status };
    if (
      verified.amount !== collection.amount ||
      verified.currency !== collection.currency
    )
      throw new ConflictException('Provider payment does not match collection');
    await this.prisma.$transaction(async (db) => {
      const locked = await db.collection.findUnique({
        where: { id: collection.id },
        include: { transaction: true },
      });
      if (!locked || locked.status === CollectionStatus.SUCCESS) return;
      const source = await db.ledgerAccount.findFirst({
        where: {
          ownerType: LedgerAccountOwnerType.SYSTEM,
          type: { in: [LedgerAccountType.BANK, LedgerAccountType.RECEIVABLE] },
          currency: locked.currency,
          status: 'ACTIVE',
        },
      });
      const destination = await db.walletBalance.findFirst({
        where: {
          wallet: { userId: locked.merchantUserId },
          currency: locked.currency,
        },
        include: { ledgerAccount: true },
      });
      if (!source || !destination)
        throw new NotFoundException(
          'Collection ledger accounts are not configured',
        );
      await this.ledger.postBalanced(db, locked.transactionId, [
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
      await db.collection.update({
        where: { id: locked.id },
        data: {
          status: CollectionStatus.SUCCESS,
          paidAt: verified.paidAt ?? new Date(),
          providerResponse: verified.rawResponse as Prisma.InputJsonValue,
        },
      });
      await db.transaction.update({
        where: { id: locked.transactionId },
        data: {
          status: TransactionStatus.SUCCESS,
          sourceAccountId: source.id,
          destinationAccountId: destination.ledgerAccountId,
        },
      });
    });
    await this.prisma.webhookEvent.update({
      where: { id: event.id },
      data: { processingStatus: 'PROCESSED', processedAt: new Date() },
    });
    return { accepted: true, status: 'SUCCESS' };
  }
}
