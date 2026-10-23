import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  LedgerAccountOwnerType,
  LedgerAccountStatus,
  LedgerAccountType,
  PrismaClient,
} from './generated/client.js';
import { SUPPORTED_CURRENCIES } from '../../shared/constants/currencies.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

try {
  for (const currency of SUPPORTED_CURRENCIES) {
    const code = `PAYSTACK_CLEARING_${currency}`;
    await prisma.ledgerAccount.upsert({
      where: { code },
      create: {
        code,
        name: `Paystack clearing account ${currency}`,
        type: LedgerAccountType.BANK,
        ownerType: LedgerAccountOwnerType.SYSTEM,
        currency,
        status: LedgerAccountStatus.ACTIVE,
      },
      update: {
        name: `Paystack clearing account ${currency}`,
        type: LedgerAccountType.BANK,
        ownerType: LedgerAccountOwnerType.SYSTEM,
        currency,
        status: LedgerAccountStatus.ACTIVE,
      },
    });
  }
} finally {
  await prisma.$disconnect();
}
