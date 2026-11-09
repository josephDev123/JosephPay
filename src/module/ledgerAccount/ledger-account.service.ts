import { Injectable, NotFoundException } from '@nestjs/common';
import {
  LedgerAccountOwnerType,
  LedgerAccountStatus,
  LedgerAccountType,
} from '../../lib/prisma/generated/enums.js';
import { PrismaService } from '../../lib/prisma/prisma.service.js';

export interface ResolvedAccount {
  accountNumber: string;
  name: string;
  currency: 'NGN' | 'USD';
}

@Injectable()
export class LedgerAccountService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveAccountNumber(accountNumber: string): Promise<ResolvedAccount> {
    const account = await this.prisma.ledgerAccount.findUnique({
      where: { accountNumber },
      include: { walletBalance: true },
    });

    if (
      !account ||
      account.type !== LedgerAccountType.CUSTOMER_WALLET ||
      account.ownerType !== LedgerAccountOwnerType.CUSTOMER ||
      account.status !== LedgerAccountStatus.ACTIVE ||
      !account.ownerId ||
      !account.walletBalance ||
      account.walletBalance.currency !== account.currency
    ) {
      throw new NotFoundException('Ledger account not found');
    }

    const owner = await this.prisma.user.findUnique({
      where: { id: account.ownerId },
      select: { firstName: true, middleName: true, lastName: true },
    });

    if (!owner) {
      throw new NotFoundException('Ledger account not found');
    }

    const name = [owner.firstName, owner.middleName, owner.lastName]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(' ');

    return {
      accountNumber: account.accountNumber as string,
      name,
      currency: account.currency,
    };
  }
}
