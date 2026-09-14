import { Injectable } from '@nestjs/common';
import {
  Prisma,
  PrismaClient,
  type Kyc,
  type Wallet,
} from '../../lib/prisma/generated/client.js';
import { PrismaService } from '../../lib/prisma/prisma.service.js';
import type { ProfileRecord } from '../Profile/mappers/profile.mapper.js';
import type { UserRecord } from '../User/mappers/user.mapper.js';

type DatabaseClient = PrismaService | PrismaClient | Prisma.TransactionClient;

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string, database: DatabaseClient = this.prisma) {
    return database.user.findUnique({
      where: {
        email,
      },
      include: {
        wallets: true,
        kyc: true,
        profile: true,
      } as never,
    }) as unknown as Promise<
      | (UserRecord & {
          passwordHash: string | null;
          wallets: Wallet[];
          kyc: Kyc | null;
          profile: ProfileRecord | null;
        })
      | null
    >;
  }
}
